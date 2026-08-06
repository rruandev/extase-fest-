import { SOBRE, EVENTO } from "@/config/evento";
import { Emblema } from "./Marca";
import Secao from "./Secao";
import Revelar from "./Revelar";

export default function Sobre() {
  return (
    <Secao id="casa" rotulo="Quem somos" titulo={SOBRE.titulo}>
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
        <Revelar>
          <div className="space-y-5">
            {SOBRE.paragrafos.map((paragrafo, i) => (
              <p
                key={i}
                className={
                  i === 0
                    ? "font-serif text-lg leading-relaxed text-texto sm:text-xl"
                    : "font-serif text-[15px] leading-relaxed text-texto-secundario"
                }
              >
                {paragrafo}
              </p>
            ))}
          </div>

          {SOBRE.destaques.length > 0 && (
            <dl className="mt-10 grid grid-cols-3 gap-4">
              {SOBRE.destaques.map((destaque) => (
                <div key={destaque.rotulo} className="card px-3 py-4 text-center">
                  <dt className="sr-only">{destaque.rotulo}</dt>
                  <dd>
                    <span className="block font-title text-2xl font-bold text-dourado-claro sm:text-3xl">
                      {destaque.valor}
                    </span>
                    <span className="mt-1 block font-serif text-[11px] uppercase tracking-[0.16em] text-texto-secundario">
                      {destaque.rotulo}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </Revelar>

        <Revelar delay={120}>
          <div className="relative mx-auto flex max-w-sm items-center justify-center">
            {/* Halo dourado atrás do emblema. */}
            <div
              className="absolute inset-0 animate-brilho rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(201,162,75,0.22) 0%, transparent 68%)",
              }}
              aria-hidden="true"
            />
            <Emblema className="relative w-full" />
          </div>
          <p className="mt-6 text-center font-serif text-xs italic tracking-widest text-dourado">
            {EVENTO.tagline}
          </p>
        </Revelar>
      </div>
    </Secao>
  );
}
