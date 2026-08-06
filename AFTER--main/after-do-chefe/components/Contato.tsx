import { CONTATO, EVENTO } from "@/config/evento";
import Secao from "./Secao";
import Revelar from "./Revelar";

const linkWhatsApp = `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(
  `Oi! Tenho uma dúvida sobre a ${EVENTO.nome}.`,
)}`;

const CANAIS = [
  {
    rotulo: "WhatsApp",
    valor: "Fale com a gente",
    href: linkWhatsApp,
    externo: true,
  },
  {
    rotulo: "Instagram",
    valor: `@${CONTATO.instagram}`,
    href: `https://instagram.com/${CONTATO.instagram}`,
    externo: true,
  },
  {
    rotulo: "E-mail",
    valor: CONTATO.email,
    href: `mailto:${CONTATO.email}`,
    externo: false,
  },
];

export default function Contato() {
  return (
    <Secao
      id="contato"
      rotulo="Fale com a casa"
      titulo="Contato"
      descricao="Dúvida sobre ingresso, mesa ou aniversário? Chama."
      centralizado
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {CANAIS.map((canal, i) => (
          <Revelar key={canal.rotulo} delay={i * 70}>
            <a
              href={canal.href}
              {...(canal.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="card group block h-full p-6 text-center transition-all duration-500 hover:border-dourado/60 hover:bg-grafite"
            >
              <p className="font-serif text-xs uppercase tracking-[0.2em] text-dourado">
                {canal.rotulo}
              </p>
              <p className="mt-2.5 break-words font-title text-sm tracking-wide text-creme transition-colors group-hover:text-dourado-claro">
                {canal.valor}
              </p>
            </a>
          </Revelar>
        ))}
      </div>
    </Secao>
  );
}
