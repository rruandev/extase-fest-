/**
 * Bokeh dourado em CSS puro — o fallback para aparelhos modestos.
 *
 * Anima só `transform` e `opacity`, que rodam no compositor: não dispara
 * layout nem paint, e por isso segura 60fps mesmo em celular de entrada.
 * Sem JS, sem canvas, sem three.js.
 */

const LUZES = [
  { cima: "8%", esq: "12%", tam: 320, atraso: 0, duracao: 26, opacidade: 0.16 },
  { cima: "52%", esq: "68%", tam: 380, atraso: -8, duracao: 32, opacidade: 0.13 },
  { cima: "28%", esq: "82%", tam: 220, atraso: -15, duracao: 24, opacidade: 0.18 },
  { cima: "72%", esq: "24%", tam: 260, atraso: -21, duracao: 30, opacidade: 0.12 },
];

export default function BokehCSS() {
  return (
    <div className="absolute inset-0">
      {LUZES.map((luz, i) => (
        <span
          key={i}
          className="bokeh-luz absolute rounded-full"
          style={{
            top: luz.cima,
            left: luz.esq,
            width: luz.tam,
            height: luz.tam,
            opacity: luz.opacidade,
            animationDelay: `${luz.atraso}s`,
            animationDuration: `${luz.duracao}s`,
            background:
              "radial-gradient(circle, rgba(231,200,115,0.9) 0%, rgba(201,162,75,0.35) 40%, transparent 70%)",
            filter: "blur(28px)",
          }}
        />
      ))}

      <style>{`
        @keyframes bokehFlutuar {
          0%   { transform: translate3d(0, 0, 0) scale(1); }
          33%  { transform: translate3d(28px, -34px, 0) scale(1.12); }
          66%  { transform: translate3d(-22px, 20px, 0) scale(0.94); }
          100% { transform: translate3d(0, 0, 0) scale(1); }
        }
        .bokeh-luz {
          animation-name: bokehFlutuar;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        @media (prefers-reduced-motion: reduce) {
          .bokeh-luz { animation: none; }
        }
      `}</style>
    </div>
  );
}
