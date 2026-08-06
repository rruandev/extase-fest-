import type { StatusLote, TipoIngresso } from "@/config/evento";

/** Formato exato da resposta de GET /api/vagas. */

export interface LoteResposta {
  numero: number;
  preco: number;
  quantidade: number;
  vendidos: number;
  restantes: number;
  status: StatusLote;
  ultimasUnidades: boolean;
}

export interface CategoriaResposta {
  nome: string;
  descricaoCurta: string;
  lotes: LoteResposta[];
  precoPorta: number;
  beneficios: string[];
  todosLotesEsgotados: boolean;
  limiteTotal: number | null;
  totalVendido: number;
  limiteTotalAtingido: boolean;
}

export type Estoque = Record<TipoIngresso, CategoriaResposta>;

export interface RespostaPix {
  id: number;
  codigo: string;
  qr_code: string;
  qr_code_base64: string;
  status: string;
  total: number;
  expiraEm: number;
}

export function brl(valor: number): string {
  return `R$ ${Number(valor).toFixed(2).replace(".", ",")}`;
}

/** O lote que está à venda agora nessa categoria, se houver. */
export function acharLoteAtivo(categoria: CategoriaResposta): LoteResposta | undefined {
  return categoria.lotes.find((l) => l.status === "ativo");
}

export function estaEsgotada(categoria: CategoriaResposta): boolean {
  return categoria.todosLotesEsgotados || categoria.limiteTotalAtingido;
}
