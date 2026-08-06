import {
  EVENTO,
  INGRESSOS,
  LOCAL,
  ORDEM_INGRESSOS,
  SEO,
  CONTATO,
  loteAtivo,
} from "@/config/evento";

/**
 * JSON-LD schema.org/Event. É o que faz o Google mostrar data, local e faixa de
 * preço direto no resultado de busca, e o que alimenta os cards de eventos.
 *
 * Os preços vêm do primeiro lote de cada categoria: sem consultar o Redis aqui,
 * a página segue estática e o preço divulgado é sempre o "a partir de".
 */
export default function DadosEstruturados() {
  const data = new Date(EVENTO.dataISO);

  // Encerramento é só um texto ("05h00"); converte pra data do dia seguinte.
  const [horaFim, minutoFim] = EVENTO.horarioEncerramento
    .replace("h", ":")
    .split(":")
    .map((n) => parseInt(n, 10) || 0);

  const fim = new Date(data);
  fim.setDate(fim.getDate() + 1);
  fim.setHours(horaFim, minutoFim, 0, 0);

  const ofertas = ORDEM_INGRESSOS.map((tipo) => {
    const categoria = INGRESSOS[tipo];
    // Sem dados de venda aqui, o lote 1 é o preço de entrada divulgado.
    const lote = loteAtivo(categoria, {}) ?? categoria.lotes[0];

    return {
      "@type": "Offer",
      name: categoria.nome,
      price: lote.preco,
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: `${SEO.siteUrl}/#ingressos`,
      validFrom: new Date().toISOString(),
    };
  });

  const dados = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: EVENTO.nomeDaFesta ? `${EVENTO.nome} — ${EVENTO.nomeDaFesta}` : EVENTO.nome,
    description: EVENTO.subtitulo,
    startDate: data.toISOString(),
    endDate: fim.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: [`${SEO.siteUrl}${SEO.ogImage}`],
    url: SEO.siteUrl,
    location: {
      "@type": "Place",
      name: LOCAL.nome,
      address: {
        "@type": "PostalAddress",
        streetAddress: LOCAL.endereco,
        addressLocality: LOCAL.bairro,
        addressRegion: EVENTO.estado,
        postalCode: LOCAL.cep,
        addressCountry: "BR",
      },
    },
    organizer: {
      "@type": "Organization",
      name: EVENTO.produzidoPor,
      url: SEO.siteUrl,
      sameAs: [`https://instagram.com/${CONTATO.instagram}`],
    },
    offers: ofertas,
    typicalAgeRange: "18-",
  };

  return (
    <script
      type="application/ld+json"
      // O conteúdo é montado a partir da config, não de entrada de usuário.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(dados) }}
    />
  );
}
