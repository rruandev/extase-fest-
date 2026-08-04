import { ESTRUTURA, DRESS_CODE } from "@/config/evento";
import Icone, { IconeCheck } from "./Icone";
import Secao from "./Secao";
import Revelar from "./Revelar";

export default function Estrutura() {
  return (
    <Secao
      rotulo="A experiência"
      titulo="Estrutura"
      descricao="O que você encontra na casa."
      centralizado
    >
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {ESTRUTURA.map((item, i) => (
          <Revelar key={item.titulo} delay={i * 60}>
            <div className="card group h-full p-5 transition-colors duration-500 hover:border-dourado/50">
              <span className="inline-flex rounded-xl border border-borda bg-dourado/10 p-2.5 text-dourado transition-colors duration-500 group-hover:text-dourado-claro">
                <Icone nome={item.icone} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-title text-sm font-bold tracking-wide text-creme">
                {item.titulo}
              </h3>
              <p className="mt-1.5 font-serif text-[13px] leading-snug text-texto-secundario">
                {item.descricao}
              </p>
            </div>
          </Revelar>
        ))}
      </div>

      {DRESS_CODE.ativo && (
        <Revelar delay={120}>
          <div className="card mt-10 p-6 sm:p-8">
            <div className="text-center">
              <h3 className="font-title text-xl font-bold tracking-wide text-creme">
                {DRESS_CODE.titulo}
              </h3>
              <p className="mx-auto mt-2 max-w-lg font-serif text-[14px] italic text-texto-secundario">
                {DRESS_CODE.descricao}
              </p>
            </div>

            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="font-serif text-xs uppercase tracking-[0.2em] text-dourado">
                  Pode entrar
                </p>
                <ul className="mt-3 space-y-2">
                  {DRESS_CODE.permitido.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[13px] text-texto">
                      <IconeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dourado" />
                      <span className="font-serif leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-serif text-xs uppercase tracking-[0.2em] text-texto-secundario">
                  Não rola
                </p>
                <ul className="mt-3 space-y-2">
                  {DRESS_CODE.proibido.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-[13px] text-texto-secundario"
                    >
                      <span
                        className="mt-1.5 h-1 w-3 shrink-0 rounded-full bg-texto-secundario/50"
                        aria-hidden="true"
                      />
                      <span className="font-serif leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Revelar>
      )}
    </Secao>
  );
}
