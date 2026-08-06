import { IconeCheck } from "../Icone";
import { acharLoteAtivo, brl, estaEsgotada, type CategoriaResposta } from "./tipos";

/**
 * Card de uma categoria de ingresso: preço do lote ativo, escada de lotes,
 * barra de progresso, benefícios e o botão de seleção.
 */
export default function CardIngresso({
  categoria,
  destaque,
  selecionado,
  aoSelecionar,
}: {
  categoria: CategoriaResposta;
  destaque: boolean;
  selecionado: boolean;
  aoSelecionar: () => void;
}) {
  const ativo = acharLoteAtivo(categoria);
  const esgotada = estaEsgotada(categoria);
  const percentual = ativo ? Math.min(100, Math.round((ativo.vendidos / ativo.quantidade) * 100)) : 0;

  return (
    <article
      className={`card relative flex h-full flex-col p-6 transition-all duration-500 sm:p-7 ${
        selecionado ? "border-dourado shadow-[0_0_36px_-14px_rgba(201,162,75,0.7)]" : ""
      } ${destaque && !selecionado ? "border-dourado/45" : ""}`}
    >
      {destaque && (
        <span className="absolute -top-3 left-6 rounded-full bg-ouro-linear px-3 py-1 font-title text-[10px] uppercase tracking-[0.16em] text-fundo">
          Experiência completa
        </span>
      )}

      <header className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-title text-xl font-bold tracking-wide text-creme">{categoria.nome}</h3>
          <p className="mt-1.5 font-serif text-[13px] italic leading-snug text-texto-secundario">
            {categoria.descricaoCurta}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <span className="block font-serif text-[10px] uppercase tracking-[0.14em] text-texto-secundario">
            {ativo ? `Lote ${ativo.numero}` : "Na porta"}
          </span>
          <span className="font-title text-3xl font-bold text-dourado-claro">
            R${ativo ? ativo.preco : categoria.precoPorta}
          </span>
        </div>
      </header>

      {/* Escada de lotes */}
      <ul className="mt-6 space-y-1.5">
        {categoria.lotes.map((lote) => (
          <li
            key={lote.numero}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-[13px] transition-colors ${
              lote.status === "ativo"
                ? "border border-dourado/40 bg-dourado/10 text-creme"
                : lote.status === "esgotado"
                  ? "text-texto-secundario/50 line-through"
                  : "text-texto-secundario"
            }`}
          >
            <span className="flex items-center gap-2 font-serif">
              Lote {lote.numero}
              {lote.status === "esgotado" && (
                <span className="rounded border border-borda px-1.5 py-0.5 text-[9px] uppercase tracking-wider no-underline">
                  Esgotado
                </span>
              )}
              {lote.status === "proximo" && (
                <span className="rounded border border-borda px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
                  Próximo
                </span>
              )}
            </span>
            <span className="font-title tracking-wide">{brl(lote.preco)}</span>
          </li>
        ))}

        <li className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] text-texto-secundario/60">
          <span className="font-serif">Na porta</span>
          <span className="font-title tracking-wide">{brl(categoria.precoPorta)}</span>
        </li>
      </ul>

      {/* Progresso do lote ativo, ou aviso de esgotado */}
      {esgotada ? (
        <div className="mt-6 rounded-xl border border-borda bg-fundo/50 p-4 text-center">
          <p className="font-title text-sm uppercase tracking-[0.14em] text-dourado-claro">
            Esgotado online
          </p>
          <p className="mt-1 font-serif text-xs text-texto-secundario">
            Vendas apenas na porta — {brl(categoria.precoPorta)}
          </p>
        </div>
      ) : (
        ativo && (
          <div className="mt-6">
            <div
              className="h-1 w-full overflow-hidden rounded-full bg-grafite"
              role="progressbar"
              aria-valuenow={percentual}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Lote ${ativo.numero} de ${categoria.nome}: ${percentual}% vendido`}
            >
              <div
                className="h-full rounded-full bg-ouro-linear transition-[width] duration-700"
                style={{ width: `${percentual}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between font-serif text-[11px] text-texto-secundario">
              <span>
                {ativo.vendidos} de {ativo.quantidade} vendidos
              </span>
              {ativo.ultimasUnidades && (
                <span className="font-semibold uppercase tracking-wider text-dourado-claro">
                  Últimas {ativo.restantes}
                </span>
              )}
            </div>
          </div>
        )
      )}

      {categoria.beneficios.length > 0 && (
        <ul className="mt-6 space-y-2.5">
          {categoria.beneficios.map((beneficio) => (
            <li key={beneficio} className="flex items-start gap-2.5 text-[13px] text-texto">
              <IconeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dourado" />
              <span className="font-serif leading-snug">{beneficio}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={aoSelecionar}
        disabled={esgotada || !ativo}
        className="btn-ouro mt-7 w-full"
      >
        {esgotada ? "Esgotado" : selecionado ? "✓ Selecionado" : `Quero ${categoria.nome}`}
      </button>
    </article>
  );
}
