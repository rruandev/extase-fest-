"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Revela o conteúdo quando ele entra na viewport. O observer é desconectado no
 * primeiro disparo — a animação acontece uma vez só, sem custo de scroll.
 *
 * Quem tem prefers-reduced-motion recebe o conteúdo já visível: o CSS neutraliza
 * a transição e aqui marcamos como visível de cara, sem depender do observer.
 */
export default function Revelar({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (semMovimento) {
      setVisivel(true);
      return;
    }

    const alvo = ref.current;
    if (!alvo) return;

    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisivel(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    observer.observe(alvo);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`revelar ${visivel ? "revelar-visivel" : ""} ${className}`}
      style={visivel && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
