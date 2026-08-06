"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import BokehCSS from "./BokehCSS";

/**
 * Decide QUAL fundo animado o visitante recebe. Três níveis:
 *
 *   1. reduced-motion  -> gradiente estático, zero animação
 *   2. aparelho fraco  -> bokeh em CSS puro (compositor, ~0% de CPU)
 *   3. aparelho capaz  -> partículas 3D (three.js), carregadas sob demanda
 *
 * O 3D entra por dynamic import com ssr:false, então three.js NÃO faz parte do
 * bundle inicial: quem cai nos níveis 1 e 2 nunca baixa esses ~150KB gzip.
 *
 * A decisão roda depois da hidratação de propósito — no servidor não dá pra
 * saber a capacidade do aparelho, e chutar erraria pra um dos lados.
 */

const Particulas3D = dynamic(() => import("./Particulas3D"), {
  ssr: false,
  loading: () => null,
});

type Nivel = "estatico" | "css" | "3d";

function detectarNivel(): Nivel {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "estatico";

  const nav = navigator as Navigator & { deviceMemory?: number };
  const nucleos = nav.hardwareConcurrency ?? 4;
  const memoria = nav.deviceMemory ?? 4;
  const telaPequena = window.matchMedia("(max-width: 640px)").matches;

  // Conexão ruim (2g/3g) ou modo economia de dados: nem tenta baixar o three.
  const conexao = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (conexao?.saveData || /(^|-)2g$/.test(conexao?.effectiveType ?? "")) return "css";

  // Aparelho modesto: o custo de baixar e rodar three.js não se paga.
  if (nucleos <= 4 || memoria <= 4) return "css";

  // Celular capaz ainda roda o 3D, só com menos partículas (ver Particulas3D).
  if (telaPequena && nucleos < 6) return "css";

  return "3d";
}

export default function FundoAnimado() {
  const [nivel, setNivel] = useState<Nivel>("estatico");

  useEffect(() => {
    setNivel(detectarNivel());
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Base estática — sempre presente, é ela que garante o contraste do texto. */}
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(201,162,75,0.18),transparent_65%)]" />

      {nivel === "css" && <BokehCSS />}
      {nivel === "3d" && <Particulas3D />}

      {/* Véu escuro por cima da animação: mantém o texto legível em qualquer nível. */}
      <div className="absolute inset-0 bg-gradient-to-b from-fundo/40 via-fundo/10 to-fundo" />
    </div>
  );
}
