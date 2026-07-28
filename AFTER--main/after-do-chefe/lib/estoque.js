// lib/estoque.js
// Camada de estoque e pedidos no Redis. Compartilhada por criar-pix,
// webhook-pix e vagas — nenhuma dessas api routes mexe em chave do Redis
// diretamente, tudo passa por aqui.
//
// Chaves:
//   poeira:vendidos:{tipo}:{numero}   -> contador (reservados + confirmados), INCRBY/DECRBY
//   poeira:pedido:{codigo}            -> JSON do pedido (permanente, é o histórico p/ admin/CSV)
//   poeira:pedidos:lista              -> lista (LPUSH) com todos os códigos já criados
//   poeira:pendentes                  -> sorted set (score = timestamp de expiração) p/ liberar reserva

import { Redis } from '@upstash/redis';
import { INGRESSOS, REGRAS_PEDIDO } from '../config/evento.js';

export function getRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

function chaveVendidos(tipo, numero) {
  return `poeira:vendidos:${tipo}:${numero}`;
}

/** Lê quantos foram vendidos (reservados + confirmados) em cada lote de uma categoria. */
export async function lerVendidos(kv, tipo) {
  const categoria = INGRESSOS[tipo];
  const chaves = categoria.lotes.map((l) => chaveVendidos(tipo, l.numero));
  const valores = await Promise.all(chaves.map((k) => kv.get(k)));
  const vendidosPorLote = {};
  categoria.lotes.forEach((lote, i) => {
    vendidosPorLote[lote.numero] = parseInt(valores[i]) || 0;
  });
  return vendidosPorLote;
}

/**
 * Reserva `quantidade` unidades de um lote de forma atômica.
 * INCRBY é atômico no Redis — se estourar a capacidade, desfaz (DECRBY) e rejeita.
 * Isso é o que garante que duas pessoas não comprem a última pulseira ao mesmo tempo.
 */
export async function reservarEstoque(kv, tipo, numero, quantidade) {
  const categoria = INGRESSOS[tipo];
  const lote = categoria.lotes.find((l) => l.numero === numero);
  const chave = chaveVendidos(tipo, numero);

  const novoTotal = await kv.incrby(chave, quantidade);
  if (novoTotal > lote.quantidade) {
    await kv.decrby(chave, quantidade);
    return { ok: false, restantes: Math.max(lote.quantidade - (novoTotal - quantidade), 0) };
  }
  return { ok: true, restantes: lote.quantidade - novoTotal };
}

export async function liberarReserva(kv, tipo, numero, quantidade) {
  await kv.decrby(chaveVendidos(tipo, numero), quantidade);
}

/** Soma o vendido em todos os lotes da categoria — usado pro limite rígido do Cowboy. */
export function totalVendidoCategoria(vendidosPorLote) {
  return Object.values(vendidosPorLote).reduce((a, b) => a + b, 0);
}

export async function gerarCodigoPedido(kv) {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem O/0/I/1 pra evitar confusão
  for (let tentativa = 0; tentativa < 10; tentativa++) {
    let sufixo = '';
    for (let i = 0; i < 4; i++) {
      sufixo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
    }
    const codigo = `${REGRAS_PEDIDO.prefixoCodigo}-${sufixo}`;
    const existe = await kv.get(`poeira:pedido:${codigo}`);
    if (!existe) return codigo;
  }
  throw new Error('Não foi possível gerar um código de pedido único');
}

export async function salvarPedido(kv, pedido) {
  await kv.set(`poeira:pedido:${pedido.codigo}`, JSON.stringify(pedido));
  await kv.lpush('poeira:pedidos:lista', pedido.codigo);
}

export async function lerPedido(kv, codigo) {
  const raw = await kv.get(`poeira:pedido:${codigo}`);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

export async function atualizarPedido(kv, codigo, patch) {
  const pedido = await lerPedido(kv, codigo);
  if (!pedido) return null;
  const atualizado = Object.assign({}, pedido, patch);
  await kv.set(`poeira:pedido:${codigo}`, JSON.stringify(atualizado));
  return atualizado;
}

export async function marcarComoPendente(kv, codigo, expiraEmMs) {
  await kv.zadd('poeira:pendentes', { score: expiraEmMs, member: codigo });
}

export async function removerDosPendentes(kv, codigo) {
  await kv.zrem('poeira:pendentes', codigo);
}

/**
 * Varre reservas pendentes vencidas (>20min sem confirmação) e devolve o
 * estoque automaticamente. Chamada no início de vagas.js e criar-pix.js —
 * como o Redis REST não avisa a aplicação quando uma chave expira, isso é
 * o que faz o papel do "TTL automático" descrito no briefing.
 */
export async function liberarExpirados(kv) {
  const agora = Date.now();
  const vencidos = await kv.zrange('poeira:pendentes', 0, agora, { byScore: true });
  if (!vencidos || vencidos.length === 0) return;

  for (const codigo of vencidos) {
    const pedido = await lerPedido(kv, codigo);
    if (pedido && pedido.status === 'pendente') {
      await liberarReserva(kv, pedido.tipo, pedido.loteNumero, pedido.quantidade);
      await atualizarPedido(kv, codigo, { status: 'expirado' });
    }
    await removerDosPendentes(kv, codigo);
  }
}
