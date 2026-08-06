"use client";

import { useEffect, useState } from "react";
import { brl, type RespostaPix } from "./tipos";

/**
 * Tela do Pix: QR Code, copia-e-cola, cronômetro da reserva e o status do
 * pagamento. Quem faz o polling é o componente pai (Compra) — aqui só exibimos.
 */
export default function PainelPix({
  pix,
  pago,
  aoVoltar,
}: {
  pix: RespostaPix;
  pago: boolean;
  aoVoltar: () => void;
}) {
  const [restante, setRestante] = useState(() => Math.max(0, pix.expiraEm - Date.now()));
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setRestante(Math.max(0, pix.expiraEm - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  }, [pix.expiraEm]);

  const expirou = restante <= 0 && !pago;
  const segundos = Math.floor(restante / 1000);
  const relogio = `${String(Math.floor(segundos / 60)).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}`;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pix.qr_code);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Navegador sem permissão de clipboard: o código segue visível na tela
      // pra seleção manual, então não há o que tratar aqui.
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6 sm:p-8">
        <h2 className="font-title text-2xl font-bold tracking-wide text-creme">Pix gerado</h2>
        <p className="mt-1 font-serif text-[13px] text-texto-secundario">
          Pedido <strong className="font-mono text-dourado-claro">{pix.codigo}</strong>
        </p>

        {!expirou && (
          <>
            {pix.qr_code_base64 && (
              <div className="mt-6 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${pix.qr_code_base64}`}
                  alt="QR Code do Pix"
                  width={220}
                  height={220}
                  className="rounded-xl bg-white p-2.5"
                />
              </div>
            )}

            <p className="mt-6 font-serif text-xs uppercase tracking-[0.16em] text-dourado">
              Pix copia e cola
            </p>
            <button
              type="button"
              onClick={copiar}
              className="mt-2 w-full break-all rounded-xl border border-borda bg-fundo/60 p-3 text-left font-mono text-[11px] leading-relaxed text-texto-secundario transition-colors hover:border-dourado/60"
              aria-label="Copiar código Pix"
            >
              {pix.qr_code}
            </button>
            <p className="mt-2 h-4 font-serif text-xs text-dourado-claro" aria-live="polite">
              {copiado ? "Código copiado." : ""}
            </p>

            <dl className="mt-4 flex items-center justify-between border-t border-borda pt-4 font-serif text-[13px]">
              <div className="flex gap-1.5">
                <dt className="text-texto-secundario">Valor:</dt>
                <dd className="font-semibold text-creme">{brl(pix.total)}</dd>
              </div>
              <div className="flex gap-1.5">
                <dt className="text-texto-secundario">Expira em:</dt>
                <dd className="font-mono font-semibold tabular-nums text-dourado-claro">{relogio}</dd>
              </div>
            </dl>
          </>
        )}

        <div className="mt-6" aria-live="polite">
          {pago ? (
            <p className="flex items-center justify-center gap-2 rounded-xl border border-dourado/50 bg-dourado/10 px-4 py-3 font-serif text-sm text-dourado-claro">
              <span className="h-2 w-2 rounded-full bg-dourado-claro" />
              Pagamento confirmado. Enviando o ingresso…
            </p>
          ) : expirou ? (
            <div className="rounded-xl border border-borda bg-fundo/50 px-4 py-5 text-center">
              <p className="font-title text-sm uppercase tracking-[0.14em] text-creme">
                Tempo esgotado
              </p>
              <p className="mt-1.5 font-serif text-[13px] leading-relaxed text-texto-secundario">
                A reserva foi liberada e seus ingressos voltaram pro estoque. É só refazer o pedido.
              </p>
              <button type="button" onClick={aoVoltar} className="btn-contorno mt-5">
                Voltar aos ingressos
              </button>
            </div>
          ) : (
            <p className="flex items-center justify-center gap-2 rounded-xl border border-borda bg-fundo/50 px-4 py-3 font-serif text-sm text-texto-secundario">
              <span className="h-2 w-2 animate-pulsoSuave rounded-full bg-dourado" />
              Esperando o Pix cair…
            </p>
          )}
        </div>
      </div>

      {!expirou && !pago && (
        <p className="mt-4 text-center font-serif text-xs leading-relaxed text-texto-secundario">
          Não feche esta página. A confirmação é automática assim que o pagamento cair.
        </p>
      )}
    </div>
  );
}
