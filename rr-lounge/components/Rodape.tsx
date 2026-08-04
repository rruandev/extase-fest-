import { CONTATO, EVENTO, LOCAL } from "@/config/evento";
import { Selo } from "./Marca";

export default function Rodape() {
  const ano = new Date().getFullYear();

  return (
    <footer className="border-t border-borda px-4 py-12 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-7 text-center">
        <div className="flex flex-col items-center">
          <Selo className="h-14 w-14" />
          <p className="mt-4 font-title text-lg font-bold tracking-marca text-creme">
            {EVENTO.nome}
          </p>
          <p className="mt-1.5 font-serif text-xs italic tracking-[0.16em] text-dourado">
            {EVENTO.tagline}
          </p>
        </div>

        <div className="filete w-32" />

        <nav aria-label="Redes sociais e contato">
          <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
            <li>
              <a
                href={`https://instagram.com/${CONTATO.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif text-[13px] tracking-wide text-texto-secundario transition-colors hover:text-dourado-claro"
              >
                @{CONTATO.instagram}
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/${CONTATO.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-serif text-[13px] tracking-wide text-texto-secundario transition-colors hover:text-dourado-claro"
              >
                WhatsApp
              </a>
            </li>
            <li>
              <a
                href={`mailto:${CONTATO.email}`}
                className="font-serif text-[13px] tracking-wide text-texto-secundario transition-colors hover:text-dourado-claro"
              >
                {CONTATO.email}
              </a>
            </li>
          </ul>
        </nav>

        <address className="not-italic font-serif text-xs leading-relaxed text-texto-secundario/80">
          {LOCAL.endereco} — {LOCAL.bairro}, {LOCAL.cidadeUF}
        </address>

        <p className="font-serif text-[11px] tracking-wide text-texto-secundario/70">
          © {ano} {EVENTO.nome} — {LOCAL.bairro}/{EVENTO.estado}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
