// POST /api/webhook-pix — notificação do Mercado Pago.
//
// É AQUI que o pedido vira "confirmado" e o e-mail com o ingresso é disparado.
// O endpoint sempre responde 200 para casos que não deve reprocessar: o MP
// reenvia notificações, e responder erro faria ele insistir sem necessidade.

import { NextResponse } from "next/server";
import { EVENTO, INGRESSOS, REGRAS_PEDIDO, CONTATO, LOCAL } from "@/config/evento";
import {
  getRedis,
  lerPedido,
  atualizarPedido,
  liberarReserva,
  removerDosPendentes,
  type Pedido,
} from "@/lib/estoque";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let corpo: { type?: string; action?: string; data?: { id?: string } };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const { type, action, data } = corpo;

  const isPayment =
    type === "payment" || action === "payment.updated" || action === "payment.created";
  if (!isPayment) {
    return NextResponse.json({ ok: true });
  }

  if (!data?.id || data.id === "123456") {
    return NextResponse.json({ ok: true, msg: "teste ignorado" });
  }

  try {
    const kv = getRedis();

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      cache: "no-store",
    });
    const payment = await mpRes.json();

    if (!mpRes.ok) {
      console.error("MP error ao buscar pagamento:", JSON.stringify(payment));
      return NextResponse.json({ ok: true });
    }

    const codigo = payment.metadata?.codigo;
    if (!codigo) {
      console.error("Pagamento sem código de pedido na metadata:", JSON.stringify(payment.metadata));
      return NextResponse.json({ ok: true, erro: "metadata incompleta" });
    }

    const pedido = await lerPedido(kv, codigo);
    if (!pedido) {
      console.error("Pedido não encontrado para código:", codigo);
      return NextResponse.json({ ok: true, erro: "pedido não encontrado" });
    }

    // Já processamos esse pedido antes (o webhook pode repetir) — não reprocessa.
    if (pedido.status !== "pendente") {
      return NextResponse.json({ ok: true, status: pedido.status });
    }

    if (payment.status === "approved") {
      await removerDosPendentes(kv, codigo);
      const atualizado = await atualizarPedido(kv, codigo, {
        status: "confirmado",
        confirmadoEm: Date.now(),
      });
      if (atualizado) await enviarEmailConfirmacao(atualizado);
      return NextResponse.json({ ok: true, status: "confirmado" });
    }

    if (payment.status === "rejected" || payment.status === "cancelled") {
      await liberarReserva(kv, pedido.tipo, pedido.loteNumero, pedido.quantidade);
      await removerDosPendentes(kv, codigo);
      await atualizarPedido(kv, codigo, { status: "cancelado" });
      return NextResponse.json({ ok: true, status: "cancelado" });
    }

    // pending / in_process — continua reservado, sem mudança.
    return NextResponse.json({ ok: true, status: payment.status });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

/* -------------------------------------------------------------------------- */

const COR = {
  fundo: "#0A0A0A",
  superficie: "#181613",
  dourado: "#C9A24B",
  ouroClaro: "#E7C873",
  creme: "#F7E7B0",
  texto: "#EDE6DA",
  textoSec: "#8F857A",
} as const;

async function enviarEmailConfirmacao(pedido: Pedido): Promise<void> {
  const categoria = INGRESSOS[pedido.tipo];
  const qtd = pedido.quantidade;
  const precoPorIngresso = pedido.total / qtd;

  const dataEvento = new Date(EVENTO.dataISO);
  const dataFormatada = dataEvento.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const horaFormatada = dataEvento.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const local = `${LOCAL.bairro}, ${EVENTO.estado}`;

  const codigos = Array.from(
    { length: qtd },
    (_, i) => `${REGRAS_PEDIDO.prefixoIngresso}${pedido.codigo}-${String(i + 1).padStart(2, "0")}`,
  );

  const ingressosHtml = codigos
    .map((codigo, i) => {
      const qrDados = encodeURIComponent(
        `${codigo}|${pedido.nome}|${EVENTO.nome}|${EVENTO.dataISO}`,
      );
      return `
    <div style="background:${COR.superficie};border-radius:16px;padding:1.5rem;color:${COR.texto};margin-bottom:1rem;border:1px solid rgba(201,162,75,0.22)">
      <p style="font-size:10px;color:${COR.dourado};text-transform:uppercase;letter-spacing:.14em;margin:0 0 6px">
        ${EVENTO.nome}${qtd > 1 ? " — Ingresso " + (i + 1) + " de " + qtd : ""}
      </p>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <p style="font-size:22px;font-weight:700;margin:0;color:${COR.creme}">${categoria.nome}</p>
        <p style="font-size:20px;font-weight:700;margin:0;color:${COR.ouroClaro}">R$ ${precoPorIngresso
          .toFixed(2)
          .replace(".", ",")}</p>
      </div>
      <hr style="border:none;border-top:1.5px dashed rgba(201,162,75,0.3);margin:0 0 1rem">
      <div style="display:flex;align-items:center;gap:1rem">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${qrDados}"
             width="80" height="80" style="border-radius:8px;background:#fff" alt="QR Code do ingresso">
        <div>
          <p style="font-size:14px;font-weight:600;margin:0 0 3px">${pedido.nome}</p>
          <p style="font-size:12px;color:${COR.textoSec};margin:0">${dataFormatada}, ${horaFormatada}</p>
          <p style="font-size:12px;color:${COR.textoSec};margin:2px 0">${local}</p>
          <p style="font-size:10px;color:rgba(237,230,218,0.35);font-family:monospace;margin:6px 0 0">${codigo}</p>
        </div>
      </div>
    </div>`;
    })
    .join("");

  const emailHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:${COR.fundo};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:2rem 1rem">
    <div style="text-align:center;margin-bottom:1.5rem">
      <h1 style="font-size:26px;font-weight:700;color:${COR.ouroClaro};margin:0;letter-spacing:.18em;text-transform:uppercase">${EVENTO.nome}</h1>
      <p style="font-size:11px;color:${COR.dourado};margin:.5rem 0 0;letter-spacing:.16em;text-transform:uppercase">${EVENTO.tagline}</p>
      <p style="font-size:13px;color:${COR.textoSec};margin:.75rem 0 0">${qtd > 1 ? qtd + " ingressos confirmados" : "Ingresso confirmado"}</p>
    </div>
    <div style="background:${COR.superficie};border-radius:16px;padding:1.5rem;margin-bottom:1rem;border:1px solid rgba(201,162,75,0.18)">
      <p style="font-size:13px;color:${COR.textoSec};margin:0 0 .5rem">Olá, <strong style="color:${COR.creme}">${pedido.nome}</strong>!</p>
      <p style="font-size:14px;color:${COR.texto};line-height:1.6;margin:0">
        Pagamento confirmado. ${qtd > 1 ? "Abaixo estão seus " + qtd + " ingressos digitais" : "Abaixo está seu ingresso digital"}. Apresente o QR Code na entrada.
      </p>
    </div>
    ${ingressosHtml}
    <div style="background:${COR.superficie};border-radius:12px;padding:1.25rem;border:1px solid rgba(201,162,75,0.18);margin-bottom:1rem">
      <p style="font-size:13px;font-weight:600;color:${COR.creme};margin:0 0 .75rem">Informações do evento</p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;color:${COR.texto}">
        <tr><td style="color:${COR.textoSec};padding:4px 0">Data</td><td style="text-align:right;font-weight:500">${dataFormatada}</td></tr>
        <tr><td style="color:${COR.textoSec};padding:4px 0">Abertura</td><td style="text-align:right;font-weight:500">${horaFormatada}</td></tr>
        <tr><td style="color:${COR.textoSec};padding:4px 0">Local</td><td style="text-align:right;font-weight:500">${LOCAL.endereco}</td></tr>
        <tr><td style="color:${COR.textoSec};padding:4px 0">Ingresso</td><td style="text-align:right;font-weight:500">${categoria.nome}</td></tr>
        <tr><td style="color:${COR.textoSec};padding:4px 0">Quantidade</td><td style="text-align:right;font-weight:500">${qtd}</td></tr>
      </table>
    </div>
    <p style="font-size:12px;color:${COR.textoSec};text-align:center;margin-top:1.5rem;line-height:1.6">
      Dúvidas? Chama no WhatsApp de suporte.<br>
      <strong style="color:${COR.creme}">Não transfira este ingresso</strong> — ele é nominal e vinculado ao seu CPF.
    </p>
  </div>
</body>
</html>`;

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: CONTATO.emailRemetente,
      to: pedido.email,
      subject: `${qtd > 1 ? qtd + " ingressos confirmados" : "Ingresso confirmado"} — ${EVENTO.nome} (${categoria.nome})`,
      html: emailHtml,
    }),
  });

  const emailData = await emailRes.json();
  if (!emailRes.ok) {
    console.error("Resend error:", JSON.stringify(emailData));
  } else {
    console.log("Email enviado para:", pedido.email, "| ID:", emailData.id);
  }
}
