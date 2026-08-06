/**
 * Wrapper do Pixel da Meta. Todo disparo do site passa por aqui.
 *
 * Se SEO.metaPixelId estiver vazio (estado atual), o script nem é injetado e
 * estas funções viram no-op — nada quebra, nada é enviado.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type EventoPixel = "PageView" | "ViewContent" | "InitiateCheckout" | "Purchase";

export function pixel(evento: EventoPixel, dados?: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("track", evento, dados ?? {});
}
