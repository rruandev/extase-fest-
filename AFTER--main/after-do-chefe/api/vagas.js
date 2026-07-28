// api/vagas.js — status de estoque dos dois tipos de ingresso (Peão, Cowboy)
import { INGRESSOS, REGRAS_ESTOQUE, calcularStatusLotes, todosLotesEsgotados, limiteTotalAtingido } from '../config/evento.js';
import { getRedis, lerVendidos, totalVendidoCategoria, liberarExpirados } from '../lib/estoque.js';

const kv = getRedis();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');

  try {
    await liberarExpirados(kv);

    const resultado = {};
    for (const tipo of Object.keys(INGRESSOS)) {
      const categoria = INGRESSOS[tipo];
      const vendidosPorLote = await lerVendidos(kv, tipo);
      const lotes = calcularStatusLotes(categoria, vendidosPorLote).map((lote) => Object.assign({}, lote, {
        ultimasUnidades: lote.status === 'ativo' && lote.restantes <= REGRAS_ESTOQUE.limiarUltimasUnidades,
      }));
      const totalVendido = totalVendidoCategoria(vendidosPorLote);

      resultado[tipo] = {
        nome: categoria.nome,
        lotes,
        precoPorta: categoria.precoPorta,
        beneficios: categoria.beneficios,
        todosLotesEsgotados: todosLotesEsgotados(categoria, vendidosPorLote),
        limiteTotal: categoria.limiteTotal,
        totalVendido,
        limiteTotalAtingido: limiteTotalAtingido(categoria, totalVendido),
      };
    }

    return res.status(200).json(resultado);
  } catch (err) {
    console.error('Erro ao buscar vagas:', err);
    return res.status(500).json({ error: 'Erro ao buscar disponibilidade' });
  }
}
