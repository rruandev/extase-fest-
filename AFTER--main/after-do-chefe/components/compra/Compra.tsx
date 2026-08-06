"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ORDEM_INGRESSOS,
  REGRAS_PEDIDO,
  type TipoIngresso,
} from "@/config/evento";
import { pixel } from "@/lib/pixel";
import CardIngresso from "./CardIngresso";
import PainelPix from "./PainelPix";
import Sucesso from "./Sucesso";
import {
  acharLoteAtivo,
  brl,
  estaEsgotada,
  type Estoque,
  type RespostaPix,
} from "./tipos";
import {
  erroDoCampo,
  formularioCompleto,
  mascararCPF,
  mascararTelefone,
  type CampoForm,
} from "./validacao";

/**
 * Fluxo de compra inteiro: escolha do ingresso -> checkout -> Pix -> confirmação.
 *
 * Tudo mora num componente só porque as três telas compartilham o mesmo estado
 * (o que foi escolhido, por quanto, de quem). O contrato com o backend é o mesmo
 * de antes: GET /api/vagas, POST /api/criar-pix, GET /api/status-pix.
 */

const INTERVALO_ESTOQUE = 45_000; // recarrega os lotes a cada 45s
const INTERVALO_POLLING = 4_000; // consulta o pagamento a cada 4s

type Fase = "compra" | "pix" | "sucesso";

const FORM_VAZIO: Record<CampoForm, string> = { nome: "", cpf: "", whatsapp: "", email: "" };

export default function Compra() {
  const [estoque, setEstoque] = useState<Estoque | null>(null);
  const [erroEstoque, setErroEstoque] = useState(false);

  const [tipoSel, setTipoSel] = useState<TipoIngresso | null>(null);
  const [quantidade, setQuantidade] = useState(1);

  const [form, setForm] = useState(FORM_VAZIO);
  const [tocados, setTocados] = useState<Record<CampoForm, boolean>>({
    nome: false,
    cpf: false,
    whatsapp: false,
    email: false,
  });

  const [fase, setFase] = useState<Fase>("compra");
  const [pix, setPix] = useState<RespostaPix | null>(null);
  const [pago, setPago] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  // Guardados no momento da compra: o estoque recarrega sozinho e não pode
  // mudar o que a tela de sucesso mostra depois que o pagamento já saiu.
  const compra = useRef({ nomeCategoria: "", precoUnitario: 0, quantidade: 1 });

  const checkoutRef = useRef<HTMLDivElement>(null);

  /* ----------------------------------------------------------------- estoque */

  const carregarEstoque = useCallback(async () => {
    try {
      const res = await fetch(`/api/vagas?t=${Date.now()}`, { cache: "no-store" });
      const dados = await res.json();
      if (!res.ok || dados.error) throw new Error(dados.error ?? "falha");
      setEstoque(dados as Estoque);
      setErroEstoque(false);
    } catch {
      setErroEstoque(true);
    }
  }, []);

  useEffect(() => {
    carregarEstoque();
    const id = setInterval(carregarEstoque, INTERVALO_ESTOQUE);
    return () => clearInterval(id);
  }, [carregarEstoque]);

  /**
   * Se o lote virou (preço subiu) ou a categoria esgotou enquanto a pessoa já
   * tinha escolhido, a seleção precisa acompanhar — senão a tela mostraria um
   * preço que o servidor não vai cobrar.
   */
  useEffect(() => {
    if (!estoque || !tipoSel || fase !== "compra") return;

    const categoria = estoque[tipoSel];
    const ativo = categoria ? acharLoteAtivo(categoria) : undefined;

    if (!categoria || !ativo || estaEsgotada(categoria)) {
      setTipoSel(null);
      setQuantidade(1);
      return;
    }

    setQuantidade((q) => Math.min(q, Math.max(1, ativo.restantes)));
  }, [estoque, tipoSel, fase]);

  /* -------------------------------------------------------------- derivados */

  const categoriaSel = estoque && tipoSel ? estoque[tipoSel] : null;
  const loteSel = categoriaSel ? acharLoteAtivo(categoriaSel) : undefined;
  const precoUnitario = loteSel?.preco ?? 0;
  const total = precoUnitario * quantidade;

  const tetoQuantidade = Math.min(
    REGRAS_PEDIDO.quantidadeMaxima,
    loteSel?.restantes ?? REGRAS_PEDIDO.quantidadeMaxima,
  );

  const podePagar = Boolean(tipoSel && loteSel) && formularioCompleto(form) && !enviando;

  /* ------------------------------------------------------------------ ações */

  function selecionar(tipo: TipoIngresso) {
    if (!estoque) return;
    const categoria = estoque[tipo];
    const ativo = acharLoteAtivo(categoria);
    if (!ativo || estaEsgotada(categoria)) return;

    setTipoSel(tipo);
    setQuantidade((q) => Math.min(q, ativo.restantes, REGRAS_PEDIDO.quantidadeMaxima));
    setErro("");

    pixel("InitiateCheckout", {
      content_name: categoria.nome,
      value: ativo.preco * quantidade,
      currency: "BRL",
    });

    checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function alterarCampo(campo: CampoForm, valor: string) {
    const tratado =
      campo === "cpf" ? mascararCPF(valor) : campo === "whatsapp" ? mascararTelefone(valor) : valor;
    setForm((f) => ({ ...f, [campo]: tratado }));
  }

  async function pagar() {
    if (!tipoSel || !categoriaSel || !loteSel) {
      setErro("Escolha o ingresso primeiro.");
      return;
    }
    if (!formularioCompleto(form)) {
      setErro("Confira os campos destacados.");
      setTocados({ nome: true, cpf: true, whatsapp: true, email: true });
      return;
    }

    setEnviando(true);
    setErro("");

    try {
      const res = await fetch("/api/criar-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: tipoSel,
          nome: form.nome.trim(),
          cpf: form.cpf.replace(/\D/g, ""),
          whatsapp: form.whatsapp.replace(/\D/g, ""),
          email: form.email.trim(),
          quantidade,
        }),
      });

      const dados = await res.json();
      if (!res.ok || !dados.id) {
        throw new Error(dados.detalhe || dados.error || "Falha ao gerar o Pix");
      }

      compra.current = {
        nomeCategoria: categoriaSel.nome,
        precoUnitario,
        quantidade,
      };

      setPix(dados as RespostaPix);
      setPago(false);
      setFase("pix");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao gerar o Pix");
      // O lote pode ter virado bem nesse instante — recarrega pra mostrar a verdade.
      carregarEstoque();
    } finally {
      setEnviando(false);
    }
  }

  /* ---------------------------------------------------------------- polling */

  useEffect(() => {
    if (fase !== "pix" || !pix || pago) return;

    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/status-pix?id=${pix.id}`, { cache: "no-store" });
        const dados = await res.json();

        if (dados.status === "approved") {
          setPago(true);
          pixel("Purchase", {
            value: compra.current.precoUnitario * compra.current.quantidade,
            currency: "BRL",
            content_name: compra.current.nomeCategoria,
          });
          setTimeout(() => setFase("sucesso"), 1800);
        }
      } catch {
        // Falha de rede pontual: a próxima batida do intervalo tenta de novo.
      }
    }, INTERVALO_POLLING);

    return () => clearInterval(id);
  }, [fase, pix, pago]);

  function voltarParaCompra() {
    setFase("compra");
    setPix(null);
    setPago(false);
    carregarEstoque();
  }

  /* ------------------------------------------------------------------ telas */

  if (fase === "pix" && pix) {
    return (
      <section id="ingressos" className="px-4 py-24 sm:px-6">
        <PainelPix pix={pix} pago={pago} aoVoltar={voltarParaCompra} />
      </section>
    );
  }

  if (fase === "sucesso") {
    return (
      <section id="ingressos" className="px-4 py-24 sm:px-6">
        <Sucesso
          codigo={pix?.codigo ?? ""}
          nomeCategoria={compra.current.nomeCategoria}
          nomeComprador={form.nome.trim()}
          email={form.email.trim()}
          quantidade={compra.current.quantidade}
          precoUnitario={compra.current.precoUnitario}
        />
      </section>
    );
  }

  return (
    <>
      <section id="ingressos" className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="rotulo-secao">Garanta o seu</p>
            <h2 className="font-title text-3xl font-bold tracking-wide text-creme sm:text-4xl">
              Ingressos
            </h2>
            <p className="mx-auto mt-4 max-w-xl font-serif text-[15px] leading-relaxed text-texto-secundario">
              O lote vira sozinho quando esgota. O preço que aparecer na hora do Pix é o que você
              paga.
            </p>
            <div className="filete mx-auto mt-6 w-24" />
          </div>

          {/* Lotes */}
          <div className="mt-12">
            {erroEstoque ? (
              <div className="card mx-auto max-w-md p-8 text-center">
                <p className="font-serif text-sm leading-relaxed text-texto-secundario">
                  Não deu pra carregar os lotes agora.
                  <br />
                  Atualize a página ou chame no WhatsApp.
                </p>
                <button type="button" onClick={carregarEstoque} className="btn-contorno mt-5">
                  Tentar de novo
                </button>
              </div>
            ) : !estoque ? (
              <div className="grid gap-6 md:grid-cols-2">
                {ORDEM_INGRESSOS.map((tipo) => (
                  <div key={tipo} className="card h-[26rem] animate-pulsoSuave" aria-hidden="true" />
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {ORDEM_INGRESSOS.map((tipo, i) => {
                  const categoria = estoque[tipo];
                  if (!categoria) return null;
                  return (
                    <CardIngresso
                      key={tipo}
                      categoria={categoria}
                      destaque={i === ORDEM_INGRESSOS.length - 1}
                      selecionado={tipoSel === tipo}
                      aoSelecionar={() => selecionar(tipo)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Checkout */}
          <div ref={checkoutRef} id="checkout" className="mt-16 scroll-mt-24">
            <div className="mx-auto max-w-md">
              <h3 className="text-center font-title text-2xl font-bold tracking-wide text-creme">
                Seus dados
              </h3>
              <p className="mt-2 text-center font-serif text-[13px] text-texto-secundario">
                O ingresso é nominal. Confira antes de pagar.
              </p>

              <div className="card mt-8 p-6 sm:p-7">
                <div className="space-y-4">
                  <Campo
                    id="nome"
                    campo="nome"
                    rotulo="Nome completo"
                    placeholder="Nome e sobrenome"
                    autoComplete="name"
                    valor={form.nome}
                    tocado={tocados.nome}
                    onChange={alterarCampo}
                    onBlur={() => setTocados((t) => ({ ...t, nome: true }))}
                  />
                  <Campo
                    id="cpf"
                    campo="cpf"
                    rotulo="CPF"
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    maxLength={14}
                    valor={form.cpf}
                    tocado={tocados.cpf}
                    onChange={alterarCampo}
                    onBlur={() => setTocados((t) => ({ ...t, cpf: true }))}
                  />
                  <Campo
                    id="whatsapp"
                    campo="whatsapp"
                    rotulo="WhatsApp"
                    placeholder="(61) 9 0000-0000"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={16}
                    valor={form.whatsapp}
                    tocado={tocados.whatsapp}
                    onChange={alterarCampo}
                    onBlur={() => setTocados((t) => ({ ...t, whatsapp: true }))}
                  />
                  <Campo
                    id="email"
                    campo="email"
                    rotulo="E-mail"
                    tipo="email"
                    placeholder="voce@email.com"
                    autoComplete="email"
                    valor={form.email}
                    tocado={tocados.email}
                    onChange={alterarCampo}
                    onBlur={() => setTocados((t) => ({ ...t, email: true }))}
                    ajuda="É pra cá que o ingresso vai."
                  />
                </div>

                {/* Quantidade */}
                <div className="mt-6 border-t border-borda pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-serif text-[13px] text-texto-secundario">
                      {categoriaSel && loteSel
                        ? `${categoriaSel.nome} — ${brl(precoUnitario)} cada`
                        : "Selecione um ingresso acima"}
                    </span>

                    <div className="flex items-center gap-1">
                      <BotaoQtd
                        rotulo="Diminuir quantidade"
                        onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                        desabilitado={!tipoSel || quantidade <= 1}
                      >
                        −
                      </BotaoQtd>
                      <span
                        className="w-9 text-center font-title text-lg font-bold tabular-nums text-creme"
                        aria-live="polite"
                      >
                        {quantidade}
                      </span>
                      <BotaoQtd
                        rotulo="Aumentar quantidade"
                        onClick={() => setQuantidade((q) => Math.min(tetoQuantidade, q + 1))}
                        desabilitado={!tipoSel || quantidade >= tetoQuantidade}
                      >
                        +
                      </BotaoQtd>
                    </div>
                  </div>

                  <dl className="mt-5 space-y-2 font-serif text-sm">
                    <div className="flex justify-between text-texto-secundario">
                      <dt>{categoriaSel ? `${quantidade}x ${categoriaSel.nome}` : "—"}</dt>
                      <dd>{total ? brl(total) : "—"}</dd>
                    </div>
                    <div className="flex justify-between border-t border-borda pt-2 font-title text-base tracking-wide text-creme">
                      <dt>Total</dt>
                      <dd className="text-dourado-claro">{total ? brl(total) : "—"}</dd>
                    </div>
                  </dl>
                </div>

                {erro && (
                  <p
                    role="alert"
                    className="mt-5 rounded-xl border px-4 py-3 font-serif text-[13px] leading-relaxed"
                    style={{ borderColor: "var(--erro)", color: "var(--erro)" }}
                  >
                    {erro}
                  </p>
                )}

                <button
                  type="button"
                  onClick={pagar}
                  disabled={!podePagar}
                  className="btn-ouro mt-6 w-full"
                >
                  {enviando ? "Gerando Pix…" : "Pagar com Pix"}
                </button>

                <p className="mt-3 text-center font-serif text-[11px] text-texto-secundario">
                  Reserva garantida por {REGRAS_PEDIDO.reservaMinutos} minutos após gerar o Pix.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA fixo no mobile — some quando o checkout já está na tela. */}
      {tipoSel && categoriaSel && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-fundo/95 px-4 py-3 backdrop-blur-md sm:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-title text-lg font-bold leading-none text-dourado-claro">
                {brl(total)}
              </p>
              <p className="mt-1 truncate font-serif text-[11px] text-texto-secundario">
                {quantidade}x {categoriaSel.nome}
              </p>
            </div>
            <button
              type="button"
              onClick={() => checkoutRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="btn-ouro shrink-0 px-5 py-2.5 text-xs"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */

function BotaoQtd({
  children,
  onClick,
  desabilitado,
  rotulo,
}: {
  children: React.ReactNode;
  onClick: () => void;
  desabilitado: boolean;
  rotulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      aria-label={rotulo}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-borda text-lg text-dourado-claro transition-colors hover:border-dourado hover:bg-dourado/10 disabled:opacity-30 disabled:hover:border-borda disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function Campo({
  id,
  campo,
  rotulo,
  valor,
  tocado,
  onChange,
  onBlur,
  ajuda,
  tipo = "text",
  ...resto
}: {
  id: string;
  campo: CampoForm;
  rotulo: string;
  valor: string;
  tocado: boolean;
  onChange: (campo: CampoForm, valor: string) => void;
  onBlur: () => void;
  ajuda?: string;
  tipo?: string;
  // O resto (placeholder, inputMode, maxLength...) vai direto pro <input>. Os
  // handlers e o valor ficam de fora: quem os controla é a assinatura acima.
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "id" | "type" | "value" | "onChange" | "onBlur"
>) {
  const mensagemErro = tocado ? erroDoCampo(campo, valor) : "";
  const valido = valor.trim() !== "" && erroDoCampo(campo, valor) === "";

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block font-serif text-xs uppercase tracking-[0.14em] text-texto-secundario"
      >
        {rotulo}
      </label>
      <input
        {...resto}
        id={id}
        type={tipo}
        value={valor}
        onChange={(e) => onChange(campo, e.target.value)}
        onBlur={onBlur}
        aria-invalid={mensagemErro ? true : undefined}
        aria-describedby={mensagemErro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined}
        className={`campo ${mensagemErro ? "campo-erro" : valido ? "campo-ok" : ""}`}
      />
      {mensagemErro ? (
        <p id={`${id}-erro`} className="mt-1.5 font-serif text-xs" style={{ color: "var(--erro)" }}>
          {mensagemErro}
        </p>
      ) : ajuda ? (
        <p id={`${id}-ajuda`} className="mt-1.5 font-serif text-xs text-texto-secundario">
          {ajuda}
        </p>
      ) : null}
    </div>
  );
}
