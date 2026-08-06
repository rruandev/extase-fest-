import Image from "next/image";
import { LINEUP, type Atracao } from "@/config/evento";
import Secao from "./Secao";
import Revelar from "./Revelar";

/**
 * Iniciais do nome, pro card funcionar antes de você ter a foto do artista.
 * Conectivos ("de", "da", "do"...) ficam de fora pra "Ana da Silva" virar "AS",
 * não "AD".
 */
const CONECTIVOS = new Set(["de", "da", "do", "das", "dos", "e"]);

function iniciais(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .filter((palavra) => palavra && !CONECTIVOS.has(palavra.toLowerCase()))
    .slice(0, 2)
    .map((palavra) => palavra[0])
    .join("")
    .toUpperCase();
}

function CardAtracao({ atracao, indice }: { atracao: Atracao; indice: number }) {
  return (
    <Revelar delay={indice * 90}>
      <article className="card group h-full overflow-hidden transition-colors duration-500 hover:border-dourado/50">
        <div className="relative aspect-square overflow-hidden bg-grafite">
          {atracao.foto ? (
            <Image
              src={atracao.foto}
              alt={atracao.nome}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div
              className="flex h-full items-center justify-center"
              style={{
                background:
                  "radial-gradient(circle at 50% 40%, rgba(201,162,75,0.18) 0%, transparent 65%)",
              }}
            >
              <span className="font-title text-5xl font-bold tracking-widest text-dourado/70">
                {iniciais(atracao.nome)}
              </span>
            </div>
          )}

          {atracao.horario && (
            <span className="absolute right-3 top-3 rounded-full border border-borda bg-fundo/85 px-3 py-1 font-title text-[11px] tracking-[0.14em] text-dourado-claro backdrop-blur-sm">
              {atracao.horario}
            </span>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-title text-lg font-bold tracking-wide text-creme">{atracao.nome}</h3>
          <p className="mt-1 font-serif text-[13px] italic text-texto-secundario">
            {atracao.estilo}
          </p>

          {atracao.instagram && (
            <a
              href={`https://instagram.com/${atracao.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-serif text-xs tracking-wide text-dourado transition-colors hover:text-dourado-claro"
            >
              @{atracao.instagram}
            </a>
          )}
        </div>
      </article>
    </Revelar>
  );
}

export default function LineUp() {
  if (LINEUP.length === 0) return null;

  return (
    <Secao
      id="lineup"
      rotulo="Atrações"
      titulo="Line-up"
      descricao="Quem comanda a noite. A ordem dos sets pode mudar até a data do evento."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {LINEUP.map((atracao, i) => (
          <CardAtracao key={atracao.nome} atracao={atracao} indice={i} />
        ))}
      </div>
    </Secao>
  );
}
