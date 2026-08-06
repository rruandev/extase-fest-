import type { ReactNode } from "react";
import Revelar from "./Revelar";

/**
 * Moldura padrão das seções: largura máxima, respiro vertical e o par
 * rótulo + título. Centraliza o ritmo da página num lugar só — mexer aqui
 * muda o espaçamento do site inteiro de uma vez.
 */
export default function Secao({
  id,
  rotulo,
  titulo,
  descricao,
  children,
  className = "",
  centralizado = false,
}: {
  id?: string;
  rotulo?: string;
  titulo?: string;
  descricao?: string;
  children: ReactNode;
  className?: string;
  centralizado?: boolean;
}) {
  return (
    <section id={id} className={`px-4 py-16 sm:px-6 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl">
        {(rotulo || titulo) && (
          <Revelar className={centralizado ? "text-center" : ""}>
            {rotulo && <p className="rotulo-secao">{rotulo}</p>}
            {titulo && (
              <h2 className="font-title text-3xl font-bold tracking-wide text-creme sm:text-4xl">
                {titulo}
              </h2>
            )}
            {descricao && (
              <p
                className={`mt-4 max-w-2xl font-serif text-[15px] leading-relaxed text-texto-secundario ${
                  centralizado ? "mx-auto" : ""
                }`}
              >
                {descricao}
              </p>
            )}
            <div className={`filete mt-6 w-24 ${centralizado ? "mx-auto" : ""}`} />
          </Revelar>
        )}

        <div className={rotulo || titulo ? "mt-10 sm:mt-12" : ""}>{children}</div>
      </div>
    </section>
  );
}
