// config/evento.js
// Fonte única de verdade do evento POEIRA: data, local, lotes, preços,
// benefícios e regras de estoque. Todas as api/*.js importam daqui —
// nada de preço/quantidade de lote hardcoded em outro arquivo.
//
// Observação: como o site é HTML estático (sem build step), o título,
// meta tags e texto do hero em public/index.html precisam ser mantidos
// em sincronia manualmente com EVENTO.dataISO abaixo — não tem como
// injetar isso automaticamente sem um framework de build.

export const EVENTO = {
  nome: 'POEIRA',
  subtitulo: 'Sertanejo raiz. Piseiro. Poeira até o joelho.',
  cidade: 'Sobradinho',
  estado: 'DF',
  local: 'Sobradinho, DF',
  dataISO: process.env.EVENT_DATE || '2026-08-08T21:00:00-03:00',
  instagram: '@poeira',
  whatsappSuporte: process.env.WHATSAPP_NUMBER || '5561991893159',
  produzidoPor: 'LANÇAR',
};

export const REGRAS_PEDIDO = {
  quantidadeMaxima: 6,
  reservaMinutos: 20,
  prefixoCodigo: 'POE',
  prefixoIngresso: '#POE2026-',
};

export const REGRAS_ESTOQUE = {
  // A partir daqui (inclusive) o lote entra em alerta de escassez ("ÚLTIMAS X").
  limiarUltimasUnidades: 10,
};

export const INGRESSOS = {
  peao: {
    tipo: 'peao',
    nome: 'Peão',
    descricaoCurta: 'Pista. Show, bar, poeira.',
    lotes: [
      { numero: 1, preco: 20, quantidade: 60 },
      { numero: 2, preco: 30, quantidade: 60 },
      { numero: 3, preco: 40, quantidade: 30 },
    ],
    precoPorta: 50,
    limiteTotal: null,
    beneficios: [],
  },
  cowboy: {
    tipo: 'cowboy',
    nome: 'Cowboy',
    descricaoCurta: 'Lounge elevado. Bar sem fila.',
    lotes: [
      { numero: 1, preco: 50, quantidade: 30 },
      { numero: 2, preco: 60, quantidade: 40 },
      { numero: 3, preco: 70, quantidade: 20 },
    ],
    precoPorta: 80,
    limiteTotal: 100,
    beneficios: [
      'Acesso ao Lounge elevado',
      'R$ 25 em crédito de consumo',
      'Fila de entrada separada',
      'Bar exclusivo sem fila',
      'Pulseira preta com o Rocking P',
    ],
  },
};

/**
 * Deriva o status de cada lote de uma categoria a partir da contagem de vendidos
 * (reservados + confirmados). Regra: o primeiro lote com estoque é o "ativo"
 * (preço em destaque); o seguinte é "próximo" (cinza); os demais "futuro";
 * qualquer lote com estoque zerado é "esgotado" — a virada é sempre automática.
 *
 * @param {typeof INGRESSOS.peao} categoria
 * @param {Record<number, number>} vendidosPorLote
 */
export function calcularStatusLotes(categoria, vendidosPorLote) {
  const indiceAtivo = categoria.lotes.findIndex((lote) => {
    const vendidos = vendidosPorLote[lote.numero] || 0;
    return vendidos < lote.quantidade;
  });

  return categoria.lotes.map((lote, i) => {
    const vendidos = vendidosPorLote[lote.numero] || 0;
    const restantes = Math.max(lote.quantidade - vendidos, 0);

    let status;
    if (restantes <= 0) status = 'esgotado';
    else if (i === indiceAtivo) status = 'ativo';
    else if (indiceAtivo !== -1 && i === indiceAtivo + 1) status = 'proximo';
    else status = 'futuro';

    return Object.assign({}, lote, { vendidos, restantes, status });
  });
}

export function loteAtivo(categoria, vendidosPorLote) {
  return calcularStatusLotes(categoria, vendidosPorLote).find(
    (lote) => lote.status === 'ativo'
  );
}

export function todosLotesEsgotados(categoria, vendidosPorLote) {
  return loteAtivo(categoria, vendidosPorLote) === undefined;
}

export function limiteTotalAtingido(categoria, totalVendidoCategoria) {
  return (
    categoria.limiteTotal != null &&
    totalVendidoCategoria >= categoria.limiteTotal
  );
}

export function formatarPreco(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
