"use client";

import { useEffect, useState } from "react";
import { EVENTO, LOCAL } from "@/config/evento";
import { Emblema } from "./Marca";
import FundoAnimado from "./fundo/FundoAnimado";

const ALVO = new Date(EVENTO.dataISO).getTime();

function calcularRestante() {
  const diff = Math.max(0, ALVO - Date.now());
  const seg = Math.floor(diff / 1000);
  return {
    dias: Math.floor(seg / 86400),
    horas: Math.floor((seg % 86400) / 3600),
    minutos: Math.floor((seg % 3600) / 60),
    segundos: seg % 60,
    acabou: diff === 0,
  };
}

function Contador() {
  // Começa nulo e só preenche depois de montar: o servidor e o cliente nunca
  // teriam o mesmo segundo, e isso daria erro de hidratação.
  const [restante, setRestante] = useState<ReturnType<typeof calcularRestante> | null>(null);

  useEffect(() => {
    setRestante(calcularRestante());
    const id = setInterval(() => setRestante(calcularRestante()), 1000);
    return () => clearInterval(id);
  }, []);

  const unidades = [
    { valor: restante?.dias, rotulo: "dias" },
    { valor: restante?.horas, rotulo: "hrs" },
    { valor: restante?.minutos, rotulo: "min" },
    { valor: restante?.segundos, rotulo: "seg" },
  ];

  if (restante?.acabou) {
    return (
      <p className="font-serif text-sm italic text-dourado-claro">A casa está aberta. Boa noite.</p>
    );
  }

  return (
    <div
      className="flex items-start justify-center gap-2 sm:gap-4"
      role="timer"
      aria-label="Contagem regressiva para a próxima festa"
    >
      {unidades.map((u) => (
        <div key={u.rotulo} className="flex flex-col items-center">
          <span className="min-w-[3rem] rounded-lg border border-borda bg-grafite/60 px-2.5 py-2 font-title text-2xl font-bold tabular-nums text-creme sm:min-w-[3.75rem] sm:text-3xl">
            {u.valor === undefined ? "––" : String(u.valor).padStart(2, "0")}
          </span>
          <span className="mt-1.5 font-serif text-[10px] uppercase tracking-[0.2em] text-texto-secundario">
            {u.rotulo}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Hero() {
  const data = new Date(EVENTO.dataISO);
  const diaSemana = data.toLocaleDateString("pt-BR", { weekday: "long" });
  const dataLonga = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <section
      id="topo"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-24 text-center"
    >
      <FundoAnimado />

      <div className="relative z-10 flex w-full max-w-2xl flex-col items-center">
        <Emblema className="w-56 animate-surgir sm:w-72" />

        {EVENTO.nomeDaFesta && (
          <p
            className="mt-7 font-serif text-xs uppercase tracking-[0.34em] text-dourado animate-surgir"
            style={{ animationDelay: "120ms" }}
          >
            {EVENTO.nomeDaFesta}
          </p>
        )}

        <h1 className="sr-only">
          {EVENTO.nome} — {EVENTO.tagline}
        </h1>

        <p
          className="mt-4 max-w-md font-serif text-lg italic text-texto animate-surgir sm:text-xl"
          style={{ animationDelay: "200ms" }}
        >
          {EVENTO.subtitulo}
        </p>

        <div
          className="mt-8 flex flex-col items-center gap-1 animate-surgir"
          style={{ animationDelay: "280ms" }}
        >
          <p className="font-title text-sm uppercase tracking-[0.2em] text-creme">
            <span className="capitalize">{diaSemana}</span>, {dataLonga} · {hora}
          </p>
          <p className="font-serif text-xs tracking-wider text-texto-secundario">
            {LOCAL.bairro} · {LOCAL.cidadeUF}
          </p>
        </div>

        <div className="mt-8 animate-surgir" style={{ animationDelay: "360ms" }}>
          <Contador />
        </div>

        <a
          href="#ingressos"
          className="btn-ouro mt-10 animate-surgir"
          style={{ animationDelay: "440ms" }}
        >
          Garantir presença
        </a>
      </div>

      {/* Filete de transição pro resto da página. */}
      <div className="filete absolute inset-x-0 bottom-0 z-10 opacity-60" />
    </section>
  );
}
