"use client";

import Script from "next/script";
import { EVENTO, SEO } from "@/config/evento";

/**
 * Pixel da Meta. Carregado com strategy="afterInteractive" pra não competir com
 * a renderização inicial. Sem ID configurado, não renderiza nada — mesmo
 * comportamento do site anterior, que tinha META_PIXEL_ID vazio.
 */
export default function MetaPixel() {
  if (!SEO.metaPixelId) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
        t=b.createElement(e);t.async=!0;t.src=v;
        s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
        (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
        fbq('init','${SEO.metaPixelId}');
        fbq('track','PageView');
        fbq('track','ViewContent',{content_name:'${EVENTO.nome}',content_type:'product'});
      `}
    </Script>
  );
}
