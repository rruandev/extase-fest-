/**
 * ============================================================================
 * RR LOUNGE — FONTE ÚNICA DE VERDADE
 * ============================================================================
 *
 * É AQUI que você edita o site. Nome do evento, data, local, line-up, lotes,
 * preços, FAQ, redes — está tudo neste arquivo. Nenhuma página, componente ou
 * API route tem texto/preço/data hardcoded; todos importam daqui.
 *
 * Regra de ouro: se um número ou texto aparece no site, ele nasce neste arquivo.
 *
 * ---------------------------------------------------------------------------
 * ATENÇÃO AO MEXER EM LOTES
 * ---------------------------------------------------------------------------
 * O estoque vive no Redis, nas chaves `{prefixoRedis}vendidos:{tipo}:{numero}`.
 * - Mudar `quantidade` de um lote é seguro a qualquer momento.
 * - Mudar `preco` só afeta compras NOVAS (pedidos já pagos guardam o preço pago).
 * - Mudar a CHAVE de um tipo (ex.: "pista" -> "pistinha") cria um contador novo
 *   e zera o estoque daquele tipo. Só faça isso de propósito.
 */

export type TipoIngresso = "pista" | "vip";

export interface Lote {
  numero: number;
  preco: number; // em reais
  quantidade: number; // estoque total do lote
}

export interface CategoriaIngresso {
  tipo: TipoIngresso;
  nome: string;
  descricaoCurta: string;
  lotes: Lote[];
  precoPorta: number;
  /** Limite rígido acumulado entre todos os lotes desta categoria. `null` = sem limite. */
  limiteTotal: number | null;
  beneficios: string[];
}

/* ==========================================================================
 * 1. A CASA / O EVENTO
 * ========================================================================== */

export const EVENTO = {
  nome: "RR LOUNGE",
  tagline: "Sobradinho · DF",

  /** Frase curta que aparece embaixo do logo no hero. */
  subtitulo: "Noites que merecem ser lembradas.",

  cidade: "Sobradinho",
  estado: "DF",

  /**
   * Data e hora de ABERTURA da próxima festa, em ISO 8601 com fuso de Brasília.
   * Dá pra sobrescrever pela env EVENT_DATE na Vercel sem mexer no código.
   * O contador regressivo do hero usa exatamente este valor.
   */
  dataISO: process.env.EVENT_DATE ?? "2026-09-12T22:00:00-03:00",

  /** Horário de encerramento, só como texto — aparece na seção "Data e horário". */
  horarioEncerramento: "05h00",

  /** Nome da edição da vez. Deixe "" se for só "RR LOUNGE". */
  nomeDaFesta: "Golden Night",

  produzidoPor: "RR LOUNGE",
} as const;

/* ==========================================================================
 * 2. TEXTO DE POSICIONAMENTO (seção "A casa")
 * ========================================================================== */

export const SOBRE = {
  titulo: "A casa",
  /** Cada string vira um parágrafo. */
  paragrafos: [
    "A RR LOUNGE nasceu pra ocupar um espaço que faltava em Sobradinho: uma casa noturna que trata a noite como experiência, não como fila de bar.",
    "Preto e dourado, som calibrado, drinks autorais e um lounge pensado pra quem quer conversar sem gritar — e pista pra quem não quer conversar coisa nenhuma.",
  ],
  /** Três números de destaque. Lista vazia ([]) esconde o bloco. */
  destaques: [
    { valor: "500", rotulo: "pessoas" },
    { valor: "2", rotulo: "ambientes" },
    { valor: "7h", rotulo: "de festa" },
  ],
} as const;

/* ==========================================================================
 * 3. LINE-UP / ATRAÇÕES
 * ========================================================================== */

export interface Atracao {
  nome: string;
  /** Ex.: "House · Techno", "Open Format", "Convidado". */
  estilo: string;
  /** Horário do set. Deixe "" pra esconder. */
  horario: string;
  /**
   * Caminho da foto dentro de /public — ex.: "/lineup/dj-fulano.jpg".
   * Sem foto? Deixe "" que o card mostra as iniciais do nome em dourado.
   */
  foto: string;
  /** @ do Instagram, sem o "@". Deixe "" pra esconder o link. */
  instagram: string;
}

export const LINEUP: Atracao[] = [
  { nome: "DJ Nome Um", estilo: "Open Format", horario: "22h00", foto: "", instagram: "" },
  { nome: "DJ Nome Dois", estilo: "House · Deep", horario: "00h00", foto: "", instagram: "" },
  { nome: "Convidado Especial", estilo: "A anunciar", horario: "02h00", foto: "", instagram: "" },
];

/* ==========================================================================
 * 4. LOCAL
 * ========================================================================== */

export const LOCAL = {
  nome: "RR Lounge",
  endereco: "Quadra 000, Conjunto 0, Lote 00",
  bairro: "Sobradinho",
  cidadeUF: "Brasília · DF",
  cep: "73000-000",

  /**
   * Endereço usado pelo botão "Como chegar" (abre no Google Maps).
   * Pode ser o endereço por extenso ou coordenadas "lat,lng".
   */
  buscaMaps: "Sobradinho, Brasília - DF",

  /**
   * Embed do mapa. Como pegar:
   * Google Maps -> Compartilhar -> Incorporar um mapa -> copie SÓ a URL do src="".
   * Deixe "" que a seção mostra o card de endereço sem mapa, sem quebrar nada.
   */
  mapaEmbedUrl: "https://www.google.com/maps?q=Sobradinho,+Bras%C3%ADlia+-+DF&output=embed",

  /** Observação embaixo do mapa. Deixe "" pra esconder. */
  observacao: "Estacionamento no local · Entrada pela lateral",
} as const;

/* ==========================================================================
 * 5. INGRESSOS E LOTES
 * ========================================================================== */

export const REGRAS_PEDIDO = {
  /** Máximo de ingressos por compra. */
  quantidadeMaxima: 6,
  /** Minutos que a reserva fica de pé esperando o Pix cair. */
  reservaMinutos: 20,
  /** Prefixo do código do pedido (ex.: RR-A7K2). */
  prefixoCodigo: "RR",
  /** Prefixo do código de cada ingresso, lido pelo verificador na porta. */
  prefixoIngresso: "#RRL2026-",
  /**
   * Prefixo das chaves no Redis. MANTIDO como "poeira:" de propósito: os pedidos
   * antigos vivem sob esse prefixo e trocá-lo os tornaria invisíveis pro
   * verificador. Os contadores de estoque já nascem zerados de qualquer forma,
   * porque os tipos de ingresso mudaram (peao/cowboy -> pista/vip).
   */
  prefixoRedis: "poeira:",
} as const;

export const REGRAS_ESTOQUE = {
  /** A partir daqui (inclusive) o lote entra em alerta de escassez ("ÚLTIMAS X"). */
  limiarUltimasUnidades: 10,
} as const;

export const INGRESSOS: Record<TipoIngresso, CategoriaIngresso> = {
  pista: {
    tipo: "pista",
    nome: "Pista",
    descricaoCurta: "Acesso à pista, bar e estrutura completa.",
    lotes: [
      { numero: 1, preco: 15, quantidade: 100 },
      { numero: 2, preco: 20, quantidade: 100 },
      { numero: 3, preco: 25, quantidade: 60 },
    ],
    precoPorta: 30,
    limiteTotal: null,
    beneficios: [],
  },
  vip: {
    tipo: "vip",
    nome: "VIP Lounge",
    descricaoCurta: "Lounge exclusivo, bar próprio e entrada preferencial.",
    lotes: [
      { numero: 1, preco: 70, quantidade: 40 },
      { numero: 2, preco: 80, quantidade: 50 },
      { numero: 3, preco: 85, quantidade: 30 },
    ],
    precoPorta: 100,
    limiteTotal: 120,
    beneficios: [
      "Acesso ao lounge exclusivo",
      "R$ 50 em crédito de consumo",
      "Entrada preferencial, sem fila",
      "Bar exclusivo do lounge",
      "Mesa reservada por ordem de chegada",
    ],
  },
};

/** Ordem em que as categorias aparecem. A última fica com o selo de destaque. */
export const ORDEM_INGRESSOS: TipoIngresso[] = ["pista", "vip"];

/* ==========================================================================
 * 6. ESTRUTURA / DIFERENCIAIS
 * ========================================================================== */

/** `icone` precisa ser um dos nomes aceitos em components/Icone.tsx. */
export type NomeIcone =
  | "taca"
  | "som"
  | "lounge"
  | "luz"
  | "seguranca"
  | "estacionamento"
  | "fumante"
  | "climatizado";

export const ESTRUTURA: { icone: NomeIcone; titulo: string; descricao: string }[] = [
  { icone: "taca", titulo: "Bar autoral", descricao: "Drinks assinados e carta de destilados." },
  { icone: "som", titulo: "Som profissional", descricao: "Line array calibrado para a casa." },
  { icone: "lounge", titulo: "Lounge VIP", descricao: "Área elevada, mesas e bar próprio." },
  { icone: "luz", titulo: "Iluminação cênica", descricao: "Projeto de luz e efeitos ao vivo." },
  { icone: "seguranca", titulo: "Segurança", descricao: "Equipe treinada e portaria controlada." },
  { icone: "estacionamento", titulo: "Estacionamento", descricao: "Vagas no local." },
  { icone: "fumante", titulo: "Área externa", descricao: "Espaço aberto para fumantes." },
  { icone: "climatizado", titulo: "Climatizado", descricao: "Ambiente interno com climatização." },
];

/* ==========================================================================
 * 7. DRESS CODE
 * ========================================================================== */

export const DRESS_CODE = {
  /** false esconde a seção inteira. */
  ativo: true,
  titulo: "Dress code",
  descricao: "Social despojado. A casa se reserva o direito de barrar a entrada.",
  permitido: ["Calça, camisa ou camiseta lisa", "Vestido ou conjunto", "Tênis casual, sapato, salto"],
  proibido: ["Chinelo e sandália de dedo", "Bermuda esportiva", "Regata masculina", "Boné dentro da casa"],
} as const;

/* ==========================================================================
 * 8. GALERIA
 * ========================================================================== */

/**
 * Fotos de eventos anteriores. Coloque os arquivos em /public/galeria/.
 * Recomendado: JPG ou WebP, 1200px no lado maior.
 * Lista vazia ([]) esconde a seção.
 */
export const GALERIA: { src: string; alt: string }[] = [
  { src: "/galeria/foto-01.jpg", alt: "Pista lotada na RR Lounge" },
  { src: "/galeria/foto-02.jpg", alt: "Lounge VIP da RR Lounge" },
  { src: "/galeria/foto-03.jpg", alt: "Bar da RR Lounge" },
  { src: "/galeria/foto-04.jpg", alt: "DJ tocando na RR Lounge" },
  { src: "/galeria/foto-05.jpg", alt: "Público na RR Lounge" },
  { src: "/galeria/foto-06.jpg", alt: "Iluminação da pista" },
];

/* ==========================================================================
 * 9. FAQ
 * ========================================================================== */

export const FAQ: { pergunta: string; resposta: string }[] = [
  {
    pergunta: "Qual a idade mínima?",
    resposta:
      "18 anos. É obrigatório apresentar documento oficial com foto na entrada — sem documento, sem entrada, mesmo com ingresso pago.",
  },
  {
    pergunta: "Quais as formas de pagamento?",
    resposta:
      "No site, apenas Pix — o ingresso é liberado assim que o pagamento cai. Na porta, aceitamos Pix, débito e crédito, sujeito à lotação.",
  },
  {
    pergunta: "Recebi meu ingresso, e agora?",
    resposta:
      "O ingresso chega por e-mail com um QR Code. Basta apresentar na entrada, impresso ou na tela do celular. Confira também a caixa de spam.",
  },
  {
    pergunta: "Posso transferir meu ingresso?",
    resposta:
      "Não. O ingresso é nominal e vinculado ao CPF informado na compra. O nome do documento precisa bater com o do ingresso.",
  },
  {
    pergunta: "E se eu não puder ir?",
    resposta:
      "Cancelamentos seguem o Código de Defesa do Consumidor: reembolso integral em até 7 dias após a compra, desde que faltem mais de 48h para o evento.",
  },
  {
    pergunta: "O lote pode virar antes de eu pagar?",
    resposta:
      "Seu lugar fica reservado por 20 minutos assim que o Pix é gerado, no preço que apareceu na tela. Passou disso sem pagar, o ingresso volta pro estoque.",
  },
];

/* ==========================================================================
 * 10. CONTATO E REDES
 * ========================================================================== */

export const CONTATO = {
  /** Formato internacional, só dígitos: 55 + DDD + número. */
  whatsapp: process.env.WHATSAPP_NUMBER ?? "5561991893159",
  /** @ do Instagram, sem o "@". */
  instagram: "rrlounge",
  email: "contato@rrlounge.com.br",

  /**
   * Remetente dos e-mails de ingresso, no formato "Nome <endereco@dominio>".
   * ATENÇÃO: o DOMÍNIO precisa estar verificado no Resend, senão o e-mail do
   * ingresso simplesmente não é entregue. Por isso o domínio segue sendo
   * extasefest.com.br (o já verificado) — só o nome exibido mudou para RR LOUNGE.
   * Ao verificar o domínio da RR Lounge no Resend, troque a linha inteira.
   */
  emailRemetente: "RR LOUNGE <ingressos@extasefest.com.br>",
} as const;

/* ==========================================================================
 * 11. SEO / COMPARTILHAMENTO
 * ========================================================================== */

export const SEO = {
  /**
   * URL pública do site, sem barra no final. Enquanto o domínio da RR Lounge não
   * existir, mantenha o domínio atual — é ele que a Vercel serve hoje.
   */
  siteUrl: "https://extasefest.com.br",
  /** Imagem de compartilhamento (1200x630) dentro de /public. */
  ogImage: "/og-rr-lounge.jpg",
  /**
   * ID do Pixel da Meta. Vazio = pixel desligado (é o estado atual do site).
   * Preencha aqui ou pela env NEXT_PUBLIC_META_PIXEL_ID.
   */
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
} as const;

/* ==========================================================================
 * LÓGICA DE LOTES — não precisa mexer daqui pra baixo
 * ========================================================================== */

export type StatusLote = "esgotado" | "ativo" | "proximo" | "futuro";

export interface LoteComStatus extends Lote {
  status: StatusLote;
  vendidos: number;
  restantes: number;
}

/**
 * Deriva o status de cada lote a partir da contagem de vendidos (reservados +
 * confirmados). O primeiro lote com estoque é o "ativo" (preço em destaque); o
 * seguinte é "próximo"; os demais "futuro"; sem estoque vira "esgotado".
 * A virada de lote é sempre automática, nunca manual.
 */
export function calcularStatusLotes(
  categoria: CategoriaIngresso,
  vendidosPorLote: Record<number, number>,
): LoteComStatus[] {
  const indiceAtivo = categoria.lotes.findIndex(
    (lote) => (vendidosPorLote[lote.numero] ?? 0) < lote.quantidade,
  );

  return categoria.lotes.map((lote, i) => {
    const vendidos = vendidosPorLote[lote.numero] ?? 0;
    const restantes = Math.max(lote.quantidade - vendidos, 0);

    let status: StatusLote;
    if (restantes <= 0) {
      status = "esgotado";
    } else if (i === indiceAtivo) {
      status = "ativo";
    } else if (indiceAtivo !== -1 && i === indiceAtivo + 1) {
      status = "proximo";
    } else {
      status = "futuro";
    }

    return { ...lote, vendidos, restantes, status };
  });
}

/** Lote atualmente ativo (o que deve aparecer com preço em destaque), se houver. */
export function loteAtivo(
  categoria: CategoriaIngresso,
  vendidosPorLote: Record<number, number>,
): LoteComStatus | undefined {
  return calcularStatusLotes(categoria, vendidosPorLote).find((lote) => lote.status === "ativo");
}

/** True quando todos os lotes da categoria estão esgotados (só resta preço de porta). */
export function todosLotesEsgotados(
  categoria: CategoriaIngresso,
  vendidosPorLote: Record<number, number>,
): boolean {
  return loteAtivo(categoria, vendidosPorLote) === undefined;
}

/** True quando a categoria bateu o limite rígido total (ex.: VIP = 120 no total). */
export function limiteTotalAtingido(
  categoria: CategoriaIngresso,
  totalVendidoCategoria: number,
): boolean {
  return categoria.limiteTotal != null && totalVendidoCategoria >= categoria.limiteTotal;
}

export function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
