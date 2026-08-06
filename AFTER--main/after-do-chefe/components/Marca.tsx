import { EVENTO } from "@/config/evento";

/**
 * A marca da RR LOUNGE, desenhada inline em SVG.
 *
 * POR QUE INLINE, e não <img src="rr-lounge-emblema.svg">:
 * o arquivo original usa <text font-family="Cinzel"> em vez de contornos
 * vetorizados. Um SVG carregado como imagem é um documento isolado — não
 * enxerga as fontes nem o CSS da página — e cairia num serif genérico.
 * Inline no DOM, ele herda as variáveis de fonte do next/font e desenha em
 * Cinzel de verdade, com o bônus de ficar nítido em qualquer tamanho e não
 * custar nenhuma requisição.
 *
 * O PNG em /public/marca/rr-lounge-emblema.png segue sendo a fonte da verdade
 * da arte e é o que alimenta o favicon e a imagem de compartilhamento
 * (veja scripts/gerar-assets.mjs).
 */

const FONTE_TITULO = { fontFamily: "var(--font-cinzel), Georgia, serif" } as const;
const FONTE_APOIO = { fontFamily: "var(--font-playfair), Georgia, serif" } as const;

/** Gradientes de ouro. `id` evita colisão quando mais de uma marca é renderizada. */
function Ouro({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-ouro`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F7E7B0" />
        <stop offset="22%" stopColor="#E7C873" />
        <stop offset="50%" stopColor="#C9A24B" />
        <stop offset="72%" stopColor="#9C7A2E" />
        <stop offset="100%" stopColor="#D8B45E" />
      </linearGradient>
      <linearGradient id={`${id}-linha`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#7a5f28" />
        <stop offset="50%" stopColor="#E7C873" />
        <stop offset="100%" stopColor="#7a5f28" />
      </linearGradient>
    </defs>
  );
}

/**
 * Emblema circular completo — monograma, LOUNGE e a localidade.
 * Fundo transparente de propósito: quem define o fundo é a seção.
 */
export function Emblema({ className = "" }: { className?: string }) {
  const id = "emb";

  return (
    <svg
      viewBox="0 0 1000 1000"
      className={className}
      role="img"
      aria-label={`${EVENTO.nome} — ${EVENTO.tagline}`}
    >
      <Ouro id={id} />

      {/* Moldura dupla */}
      <circle cx="500" cy="500" r="468" fill="none" stroke={`url(#${id}-ouro)`} strokeWidth="3" />
      <circle
        cx="500"
        cy="500"
        r="448"
        fill="none"
        stroke={`url(#${id}-ouro)`}
        strokeWidth="1.4"
        opacity="0.85"
      />

      {/* Losangos ao redor do centro */}
      <g fill={`url(#${id}-ouro)`}>
        <rect x="491" y="449" width="18" height="18" transform="rotate(45 500 458)" />
        <rect x="491" y="533" width="18" height="18" transform="rotate(45 500 542)" />
        <rect x="449" y="491" width="18" height="18" transform="rotate(45 458 500)" />
        <rect x="533" y="491" width="18" height="18" transform="rotate(45 542 500)" />
      </g>

      {/* Monograma */}
      <text
        x="500"
        y="470"
        fontWeight="900"
        fontSize="300"
        textAnchor="middle"
        letterSpacing="-34"
        fill={`url(#${id}-ouro)`}
        style={FONTE_TITULO}
      >
        RR
      </text>

      {/* Filete + losango central */}
      <rect x="330" y="602" width="340" height="2.4" fill={`url(#${id}-linha)`} />
      <rect
        x="497"
        y="596"
        width="14"
        height="14"
        transform="rotate(45 504 603)"
        fill={`url(#${id}-ouro)`}
      />

      <text
        x="500"
        y="688"
        fontWeight="700"
        fontSize="86"
        textAnchor="middle"
        letterSpacing="14"
        fill={`url(#${id}-ouro)`}
        style={FONTE_TITULO}
      >
        LOUNGE
      </text>

      <text
        x="500"
        y="742"
        fontStyle="italic"
        fontWeight="500"
        fontSize="30"
        textAnchor="middle"
        letterSpacing="6"
        fill="#cdb985"
        style={FONTE_APOIO}
      >
        {EVENTO.tagline}
      </text>
    </svg>
  );
}

/**
 * Selo compacto: só a moldura e o monograma. Usado no header e no rodapé,
 * onde o texto do emblema completo ficaria ilegível.
 */
export function Selo({ className = "" }: { className?: string }) {
  const id = "selo";

  return (
    <svg viewBox="0 0 1000 1000" className={className} aria-hidden="true" focusable="false">
      <Ouro id={id} />
      <circle cx="500" cy="500" r="468" fill="none" stroke={`url(#${id}-ouro)`} strokeWidth="10" />
      <circle
        cx="500"
        cy="500"
        r="430"
        fill="none"
        stroke={`url(#${id}-ouro)`}
        strokeWidth="4"
        opacity="0.8"
      />
      <text
        x="500"
        y="640"
        fontWeight="900"
        fontSize="440"
        textAnchor="middle"
        letterSpacing="-50"
        fill={`url(#${id}-ouro)`}
        style={FONTE_TITULO}
      >
        RR
      </text>
    </svg>
  );
}

/** Lockup horizontal: selo + nome. É a assinatura do header. */
export function MarcaHorizontal({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <Selo className="h-8 w-8 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="font-title text-[15px] font-bold tracking-[0.2em] text-creme">
          RR LOUNGE
        </span>
        <span className="mt-1 font-serif text-[9px] italic tracking-[0.18em] text-dourado">
          {EVENTO.tagline}
        </span>
      </span>
    </span>
  );
}
