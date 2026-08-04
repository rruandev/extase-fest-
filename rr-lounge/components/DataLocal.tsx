import { EVENTO, LOCAL } from "@/config/evento";
import Secao from "./Secao";
import Revelar from "./Revelar";

/**
 * "Data e horário" + "Local" numa seção só: são as duas informações que a pessoa
 * procura junto ("quando e onde"), e separá-las obrigaria a rolar duas vezes.
 */
export default function DataLocal() {
  const data = new Date(EVENTO.dataISO);

  const diaSemana = data.toLocaleDateString("pt-BR", { weekday: "long" });
  const dataCompleta = data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const abertura = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const linkMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    LOCAL.buscaMaps,
  )}`;

  const enderecoCompleto = `${LOCAL.endereco} — ${LOCAL.bairro}, ${LOCAL.cidadeUF}`;

  return (
    <Secao id="local" rotulo="Quando e onde" titulo="Data e local">
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Quando */}
        <Revelar className="lg:col-span-2">
          <div className="card flex h-full flex-col justify-between p-6 sm:p-8">
            <div>
              <p className="font-serif text-xs uppercase tracking-[0.24em] text-dourado">Data</p>
              <p className="mt-3 font-title text-2xl font-bold capitalize leading-tight text-creme sm:text-3xl">
                {diaSemana}
              </p>
              <p className="mt-1 font-serif text-lg text-texto">{dataCompleta}</p>
            </div>

            <dl className="mt-8 space-y-3 border-t border-borda pt-6">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="font-serif text-[13px] text-texto-secundario">Abertura dos portões</dt>
                <dd className="font-title text-base tracking-wider text-dourado-claro">{abertura}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="font-serif text-[13px] text-texto-secundario">Encerramento</dt>
                <dd className="font-title text-base tracking-wider text-dourado-claro">
                  {EVENTO.horarioEncerramento}
                </dd>
              </div>
            </dl>
          </div>
        </Revelar>

        {/* Onde */}
        <Revelar delay={100} className="lg:col-span-3">
          <div className="card flex h-full flex-col overflow-hidden">
            {LOCAL.mapaEmbedUrl && (
              <div className="relative h-56 w-full border-b border-borda sm:h-64">
                <iframe
                  src={LOCAL.mapaEmbedUrl}
                  title={`Mapa — ${LOCAL.nome}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  className="h-full w-full"
                  // O embed do Google Maps não aceita tema escuro por parâmetro;
                  // o filtro CSS é o que encaixa ele no preto e dourado da casa.
                  style={{ border: 0, filter: "grayscale(0.92) contrast(1.15) brightness(0.62)" }}
                />
              </div>
            )}

            <div className="flex flex-1 flex-col justify-between gap-6 p-6 sm:p-8">
              <div>
                <p className="font-serif text-xs uppercase tracking-[0.24em] text-dourado">Local</p>
                <p className="mt-3 font-title text-xl font-bold tracking-wide text-creme">
                  {LOCAL.nome}
                </p>
                <address className="mt-2 not-italic font-serif text-[15px] leading-relaxed text-texto-secundario">
                  {LOCAL.endereco}
                  <br />
                  {LOCAL.bairro} · {LOCAL.cidadeUF}
                  {LOCAL.cep && (
                    <>
                      <br />
                      CEP {LOCAL.cep}
                    </>
                  )}
                </address>

                {LOCAL.observacao && (
                  <p className="mt-3 font-serif text-[13px] italic text-dourado/80">
                    {LOCAL.observacao}
                  </p>
                )}
              </div>

              <a
                href={linkMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-contorno self-start"
                aria-label={`Como chegar — abrir ${enderecoCompleto} no Google Maps`}
              >
                Como chegar
              </a>
            </div>
          </div>
        </Revelar>
      </div>
    </Secao>
  );
}
