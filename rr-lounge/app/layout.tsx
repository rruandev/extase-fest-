import type { Metadata, Viewport } from "next";
import { Cinzel, Playfair_Display } from "next/font/google";
import { EVENTO, SEO, LOCAL } from "@/config/evento";
import MetaPixel from "@/components/MetaPixel";
import "./globals.css";

// Cinzel e Playfair são fontes variáveis: omitir `weight` faz o next/font baixar
// UM arquivo por família cobrindo toda a faixa de peso (400–900), em vez de um
// arquivo por peso. Sai mais leve e libera o 900 que o monograma da marca usa.
// display:"swap" evita texto invisível enquanto a fonte carrega (FOIT).
const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const dataEvento = new Date(EVENTO.dataISO);
const dataCurta = dataEvento.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });

const titulo = `${EVENTO.nome} — ${EVENTO.tagline}`;
const descricao = `${EVENTO.subtitulo} ${EVENTO.nomeDaFesta ? EVENTO.nomeDaFesta + " · " : ""}${dataCurta}, em ${LOCAL.bairro}. Ingressos Pista e VIP Lounge.`;

export const metadata: Metadata = {
  metadataBase: new URL(SEO.siteUrl),
  title: {
    default: titulo,
    template: `%s — ${EVENTO.nome}`,
  },
  description: descricao,
  applicationName: EVENTO.nome,
  keywords: [
    "RR Lounge",
    "casa noturna Sobradinho",
    "balada Brasília",
    "lounge DF",
    "ingressos",
    EVENTO.nomeDaFesta,
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: EVENTO.nome,
    title: titulo,
    description: descricao,
    url: "/",
    locale: "pt_BR",
    images: [{ url: SEO.ogImage, width: 1200, height: 630, alt: `${EVENTO.nome} — ${EVENTO.tagline}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: titulo,
    description: descricao,
    images: [SEO.ogImage],
  },
  // O favicon e o ícone do iOS vêm de app/icon.png e app/apple-icon.png — o Next
  // os detecta pelo nome do arquivo e injeta as tags sozinho. Ambos são gerados
  // a partir do emblema por `npm run assets`.
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${playfair.variable}`}>
      <body className="textura-grao">
        {children}
        <MetaPixel />
      </body>
    </html>
  );
}
