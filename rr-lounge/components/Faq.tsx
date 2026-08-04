import { FAQ } from "@/config/evento";
import Secao from "./Secao";
import Revelar from "./Revelar";

/**
 * FAQ em <details>/<summary> nativo: abre e fecha sem uma linha de JS, já vem
 * acessível por teclado e leitor de tela, e o conteúdo é indexável pelo Google
 * mesmo fechado.
 */
export default function Faq() {
  if (FAQ.length === 0) return null;

  return (
    <Secao id="faq" rotulo="Antes de vir" titulo="Perguntas frequentes" centralizado>
      <div className="mx-auto max-w-2xl space-y-3">
        {FAQ.map((item, i) => (
          <Revelar key={item.pergunta} delay={i * 50}>
            <details className="card group px-5 py-4 transition-colors duration-300 hover:border-dourado/45 open:border-dourado/45">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-title text-sm font-bold tracking-wide text-creme marker:content-none">
                {item.pergunta}
                <span
                  className="shrink-0 text-lg font-normal text-dourado transition-transform duration-300 group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 font-serif text-[14px] leading-relaxed text-texto-secundario">
                {item.resposta}
              </p>
            </details>
          </Revelar>
        ))}
      </div>
    </Secao>
  );
}
