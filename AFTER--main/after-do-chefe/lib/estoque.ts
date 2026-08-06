/**
 * Camada de estoque e pedidos no Redis. Compartilhada por criar-pix, webhook-pix
 * e vagas — nenhuma API route mexe em chave do Redis diretamente, tudo passa aqui.
 *
 * Chaves (com o prefixo de REGRAS_PEDIDO.prefixoRedis):
 *   {p}vendidos:{tipo}:{numero}   -> contador (reservados + confirmados), INCRBY/DECRBY
 *   {p}pedido:{codigo}            -> JSON do pedido (permanente, é o histórico)
 *   {p}pedidos:lista              -> lista (LPUSH) com todos os códigos já criados
 *   {p}pendentes                  -> sorted set (score = timestamp de expiração)
 */

import { Redis } from "@upstash/redis";
import { INGRESSOS, REGRAS_PEDIDO, type TipoIngresso } from "@/config/evento";

export interface Pedido {
  codigo: string;
  tipo: TipoIngresso;
  loteNumero: number;
  quantidade: number;
  precoUnitario: number;
  total: number;
  nome: string;
  whatsapp: string;
  email: string;
  cpf: string;
  status: "pendente" | "confirmado" | "cancelado" | "expirado";
  paymentId: number | string;
  criadoEm: number;
  expiraEm: number;
  confirmadoEm?: number;
}

const P = REGRAS_PEDIDO.prefixoRedis;

/**
 * O client é criado sob demanda, não no topo do módulo: durante o `next build`
 * as envs do Upstash podem não estar presentes, e instanciar no import quebraria
 * a coleta de rotas. Cada route handler chama isto dentro do request.
 */
export function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("UPSTASH_REDIS_REST_URL/TOKEN não configurados");
  }

  return new Redis({ url, token });
}

function chaveVendidos(tipo: TipoIngresso, numero: number): string {
  return `${P}vendidos:${tipo}:${numero}`;
}

/** Lê quantos foram vendidos (reservados + confirmados) em cada lote de uma categoria. */
export async function lerVendidos(
  kv: Redis,
  tipo: TipoIngresso,
): Promise<Record<number, number>> {
  const categoria = INGRESSOS[tipo];
  const valores = await Promise.all(
    categoria.lotes.map((l) => kv.get<string | number>(chaveVendidos(tipo, l.numero))),
  );

  const vendidosPorLote: Record<number, number> = {};
  categoria.lotes.forEach((lote, i) => {
    vendidosPorLote[lote.numero] = Number(valores[i]) || 0;
  });
  return vendidosPorLote;
}

/**
 * Reserva `quantidade` unidades de um lote de forma atômica.
 * INCRBY é atômico no Redis — se estourar a capacidade, desfaz (DECRBY) e rejeita.
 * É isso que garante que duas pessoas não comprem o último ingresso ao mesmo tempo.
 */
export async function reservarEstoque(
  kv: Redis,
  tipo: TipoIngresso,
  numero: number,
  quantidade: number,
): Promise<{ ok: boolean; restantes: number }> {
  const categoria = INGRESSOS[tipo];
  const lote = categoria.lotes.find((l) => l.numero === numero);
  if (!lote) return { ok: false, restantes: 0 };

  const chave = chaveVendidos(tipo, numero);
  const novoTotal = await kv.incrby(chave, quantidade);

  if (novoTotal > lote.quantidade) {
    await kv.decrby(chave, quantidade);
    return { ok: false, restantes: Math.max(lote.quantidade - (novoTotal - quantidade), 0) };
  }
  return { ok: true, restantes: lote.quantidade - novoTotal };
}

export async function liberarReserva(
  kv: Redis,
  tipo: TipoIngresso,
  numero: number,
  quantidade: number,
): Promise<void> {
  await kv.decrby(chaveVendidos(tipo, numero), quantidade);
}

/** Soma o vendido em todos os lotes da categoria — usado pro limite rígido do VIP. */
export function totalVendidoCategoria(vendidosPorLote: Record<number, number>): number {
  return Object.values(vendidosPorLote).reduce((a, b) => a + b, 0);
}

export async function gerarCodigoPedido(kv: Redis): Promise<string> {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem O/0/I/1 pra evitar confusão

  for (let tentativa = 0; tentativa < 10; tentativa++) {
    let sufixo = "";
    for (let i = 0; i < 4; i++) {
      sufixo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
    }
    const codigo = `${REGRAS_PEDIDO.prefixoCodigo}-${sufixo}`;
    const existe = await kv.get(`${P}pedido:${codigo}`);
    if (!existe) return codigo;
  }
  throw new Error("Não foi possível gerar um código de pedido único");
}

export async function salvarPedido(kv: Redis, pedido: Pedido): Promise<void> {
  await kv.set(`${P}pedido:${pedido.codigo}`, JSON.stringify(pedido));
  await kv.lpush(`${P}pedidos:lista`, pedido.codigo);
}

export async function lerPedido(kv: Redis, codigo: string): Promise<Pedido | null> {
  const raw = await kv.get<string | Pedido>(`${P}pedido:${codigo}`);
  if (!raw) return null;
  return typeof raw === "string" ? (JSON.parse(raw) as Pedido) : raw;
}

export async function atualizarPedido(
  kv: Redis,
  codigo: string,
  patch: Partial<Pedido>,
): Promise<Pedido | null> {
  const pedido = await lerPedido(kv, codigo);
  if (!pedido) return null;

  const atualizado = { ...pedido, ...patch };
  await kv.set(`${P}pedido:${codigo}`, JSON.stringify(atualizado));
  return atualizado;
}

export async function marcarComoPendente(
  kv: Redis,
  codigo: string,
  expiraEmMs: number,
): Promise<void> {
  await kv.zadd(`${P}pendentes`, { score: expiraEmMs, member: codigo });
}

export async function removerDosPendentes(kv: Redis, codigo: string): Promise<void> {
  await kv.zrem(`${P}pendentes`, codigo);
}

/**
 * Varre reservas pendentes vencidas (>20min sem confirmação) e devolve o estoque.
 * Chamada no início de /api/vagas e /api/criar-pix — como o Redis REST não avisa
 * a aplicação quando uma chave expira, isso faz o papel do "TTL automático".
 */
export async function liberarExpirados(kv: Redis): Promise<void> {
  const agora = Date.now();
  const vencidos = await kv.zrange<string[]>(`${P}pendentes`, 0, agora, { byScore: true });
  if (!vencidos || vencidos.length === 0) return;

  for (const codigo of vencidos) {
    const pedido = await lerPedido(kv, codigo);
    if (pedido && pedido.status === "pendente") {
      await liberarReserva(kv, pedido.tipo, pedido.loteNumero, pedido.quantidade);
      await atualizarPedido(kv, codigo, { status: "expirado" });
    }
    await removerDosPendentes(kv, codigo);
  }
}
