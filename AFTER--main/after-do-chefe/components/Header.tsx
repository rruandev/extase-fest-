"use client";

import { useEffect, useState } from "react";
import { MarcaHorizontal } from "./Marca";

const LINKS = [
  { href: "#casa", rotulo: "A casa" },
  { href: "#lineup", rotulo: "Line-up" },
  { href: "#local", rotulo: "Local" },
  { href: "#ingressos", rotulo: "Ingressos" },
  { href: "#faq", rotulo: "FAQ" },
];

export default function Header() {
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 24);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        rolou ? "border-b border-borda bg-fundo/85 backdrop-blur-md" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#topo" className="flex items-center" aria-label="Início">
          <MarcaHorizontal />
        </a>

        <nav aria-label="Seções do site" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="font-serif text-[13px] tracking-wide text-texto-secundario transition-colors hover:text-dourado-claro"
                >
                  {link.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a href="#ingressos" className="btn-contorno hidden text-[11px] sm:inline-block">
          Garantir presença
        </a>
      </div>
    </header>
  );
}
