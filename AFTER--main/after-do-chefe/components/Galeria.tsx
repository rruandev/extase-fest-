import Image from "next/image";
import { GALERIA } from "@/config/evento";
import Secao from "./Secao";
import Revelar from "./Revelar";

/**
 * Grid de fotos de edições anteriores.
 *
 * As imagens passam por next/image: ele serve AVIF/WebP conforme o navegador,
 * gera os tamanhos certos pra cada breakpoint e reserva o espaço no layout
 * (sem "pulo" de CLS). As três primeiras carregam eager porque costumam entrar
 * na primeira dobra em telas grandes; o resto é lazy.
 */
export default function Galeria() {
  if (GALERIA.length === 0) return null;

  return (
    <Secao
      rotulo="Registros"
      titulo="Galeria"
      descricao="Como foram as noites anteriores."
      centralizado
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {GALERIA.map((foto, i) => (
          <Revelar key={foto.src} delay={(i % 3) * 80}>
            <figure className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-borda bg-grafite sm:aspect-square">
              <Image
                src={foto.src}
                alt={foto.alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 380px"
                loading={i < 3 ? "eager" : "lazy"}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Véu dourado sutil no hover. */}
              <span
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-fundo/80 via-transparent to-transparent opacity-70 transition-opacity duration-500 group-hover:opacity-40"
                aria-hidden="true"
              />
            </figure>
          </Revelar>
        ))}
      </div>
    </Secao>
  );
}
