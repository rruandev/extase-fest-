// GET /api/vagas — status de estoque de todas as categorias de ingresso.
// Mesmo contrato de resposta da versão anterior (Vercel Function em api/vagas.js),
// pra qualquer coisa que já consuma esse endpoint continuar funcionando.

import { NextResponse } from "next/server";
import {
  INGRESSOS,
  REGRAS_ESTOQUE,
  calcularStatusLotes,
  todosLotesEsgotados,
  limiteTotalAtingido,
  type TipoIngresso,
} from "@/config/evento";
import {
  getRedis,
  lerVendidos,
  totalVendidoCategoria,
  liberarExpirados,
} from "@/lib/estoque";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const kv = getRedis();
    await liberarExpirados(kv);

    const resultado: Record<string, unknown> = {};

    for (const tipo of Object.keys(INGRESSOS) as TipoIngresso[]) {
      const categoria = INGRESSOS[tipo];
      const vendidosPorLote = await lerVendidos(kv, tipo);

      const lotes = calcularStatusLotes(categoria, vendidosPorLote).map((lote) => ({
        ...lote,
        ultimasUnidades:
          lote.status === "ativo" && lote.restantes <= REGRAS_ESTOQUE.limiarUltimasUnidades,
      }));

      const totalVendido = totalVendidoCategoria(vendidosPorLote);

      resultado[tipo] = {
        nome: categoria.nome,
        descricaoCurta: categoria.descricaoCurta,
        lotes,
        precoPorta: categoria.precoPorta,
        beneficios: categoria.beneficios,
        todosLotesEsgotados: todosLotesEsgotados(categoria, vendidosPorLote),
        limiteTotal: categoria.limiteTotal,
        totalVendido,
        limiteTotalAtingido: limiteTotalAtingido(categoria, totalVendido),
      };
    }

    return NextResponse.json(resultado, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Erro ao buscar vagas:", err);
    return NextResponse.json({ error: "Erro ao buscar disponibilidade" }, { status: 500 });
  }
}
