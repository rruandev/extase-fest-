import type { NomeIcone } from "@/config/evento";

/**
 * Ícones em SVG inline (traço de 1.5px, mesmo grid de 24px). Inline em vez de
 * biblioteca: são poucos, não entram no bundle de JS e podem ser estilizados
 * por currentColor.
 *
 * Pra adicionar um ícone novo: crie a chave aqui e depois use o mesmo nome no
 * campo `icone` de ESTRUTURA, em config/evento.ts.
 */

const CAMINHOS: Record<NomeIcone, React.ReactNode> = {
  taca: (
    <>
      <path d="M8 3h8l-1 6a3 3 0 0 1-6 0L8 3Z" />
      <path d="M12 15v6M9 21h6" />
    </>
  ),
  som: (
    <>
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  lounge: (
    <>
      <path d="M4 12V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5" />
      <path d="M3 12h18v5H3zM5 17v3M19 17v3" />
    </>
  ),
  luz: (
    <>
      <path d="M12 3v2M5.6 5.6l1.4 1.4M3 12h2M17 7l1.4-1.4M19 12h2" />
      <circle cx="12" cy="13" r="4" />
      <path d="M9.5 20h5" />
    </>
  ),
  seguranca: (
    <>
      <path d="M12 3 5 6v6c0 4.4 3 8.2 7 9 4-.8 7-4.6 7-9V6l-7-3Z" />
      <path d="m9.5 12 1.8 1.8L15 10" />
    </>
  ),
  estacionamento: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M10 17V8h3a2.5 2.5 0 0 1 0 5h-3" />
    </>
  ),
  fumante: (
    <>
      <path d="M3 17h14v3H3zM19 17h2v3h-2z" />
      <path d="M17 13c0-2-2-2-2-4s2-2.5 2-4" />
      <path d="M13 13c0-1.5-1.5-1.5-1.5-3" />
    </>
  ),
  climatizado: (
    <>
      <path d="M12 3v18M3 12h18" />
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
};

export default function Icone({
  nome,
  className = "h-6 w-6",
}: {
  nome: NomeIcone;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {CAMINHOS[nome]}
    </svg>
  );
}

/** Check dourado usado nas listas de benefícios. */
export function IconeCheck({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
