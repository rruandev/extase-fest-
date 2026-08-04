import { CONTATO, EVENTO, LOCAL, REGRAS_PEDIDO } from "@/config/evento";
import { brl } from "./tipos";

/**
 * Tela pós-pagamento. Os ingressos exibidos aqui são uma prévia visual — o
 * ingresso válido é o que chega por e-mail, com o QR Code gerado no webhook.
 */
export default function Sucesso({
  codigo,
  nomeCategoria,
  nomeComprador,
  email,
  quantidade,
  precoUnitario,
}: {
  codigo: string;
  nomeCategoria: string;
  nomeComprador: string;
  email: string;
  quantidade: number;
  precoUnitario: number;
}) {
  const data = new Date(EVENTO.dataISO);
  const dataCurta = data.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const linkSuporte = `https://wa.me/${CONTATO.whatsapp}?text=${encodeURIComponent(
    `Oi! Comprei meu ingresso da ${EVENTO.nome} (pedido ${codigo}) e preciso de ajuda.`,
  )}`;

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 text-center">
        <h2 className="font-title text-3xl font-bold tracking-wide text-creme">Confirmado</h2>
        <p className="mt-2 font-serif text-[13px] text-texto-secundario">
          {quantidade > 1 ? `${quantidade} ingressos enviados` : "Ingresso enviado"} para{" "}
          <strong className="text-dourado-claro">{email}</strong>
        </p>
      </div>

      <div className="space-y-3">
        {Array.from({ length: quantidade }, (_, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-serif text-[10px] uppercase tracking-[0.16em] text-dourado">
                  {EVENTO.nome}
                  {quantidade > 1 ? ` · ${i + 1}/${quantidade}` : ""}
                </p>
                <p className="mt-1 font-title text-xl font-bold tracking-wide text-creme">
                  {nomeCategoria}
                </p>
              </div>
              <p className="font-title text-xl font-bold text-dourado-claro">
                {brl(precoUnitario)}
              </p>
            </div>

            <hr className="my-4 border-0 border-t border-dashed border-dourado/25" />

            <p className="font-serif text-sm font-semibold text-texto">{nomeComprador}</p>
            <p className="mt-0.5 font-serif text-xs capitalize text-texto-secundario">
              {dataCurta} · {hora} — {LOCAL.bairro}, {LOCAL.cidadeUF}
            </p>
            <p className="mt-2 font-mono text-[10px] text-texto-secundario/70">
              {REGRAS_PEDIDO.prefixoIngresso}
              {codigo}-{String(i + 1).padStart(2, "0")}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center font-serif text-xs leading-relaxed text-texto-secundario">
        O e-mail com o QR Code pode levar alguns minutos. Não achou? Confira o spam.
        <br />
        <strong className="text-creme">Não transfira seu ingresso</strong> — ele é nominal e
        vinculado ao seu CPF.
      </p>

      <a
        href={linkSuporte}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-contorno mt-6 block text-center"
      >
        Falar no WhatsApp
      </a>
    </div>
  );
}
