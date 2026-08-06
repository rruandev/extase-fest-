// POST /api/criar-pix — reserva estoque e cria a cobrança Pix no Mercado Pago.
//
// Regras que não podem mudar sem quebrar a venda:
//  - o PREÇO nunca vem do cliente; é sempre calculado aqui a partir do lote ativo;
//  - a reserva é feita ANTES de chamar o MP, e é desfeita em qualquer falha;
//  - o pedido só vira "confirmado" no webhook, nunca aqui.

import { NextResponse } from "next/server";
import {
  INGRESSOS,
  REGRAS_PEDIDO,
  SEO,
  EVENTO,
  loteAtivo,
  limiteTotalAtingido,
  type TipoIngresso,
} from "@/config/evento";
import {
  getRedis,
  lerVendidos,
  totalVendidoCategoria,
  reservarEstoque,
  liberarReserva,
  gerarCodigoPedido,
  salvarPedido,
  marcarComoPendente,
  liberarExpirados,
} from "@/lib/estoque";

export const dynamic = "force-dynamic";

interface CorpoPedido {
  tipo?: string;
  nome?: string;
  whatsapp?: string;
  email?: string;
  cpf?: string;
  quantidade?: number | string;
}

export async function POST(req: Request) {
  if (!process.env.MP_ACCESS_TOKEN) {
    console.error("MP_ACCESS_TOKEN não configurado");
    return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 });
  }

  let corpo: CorpoPedido;
  try {
    corpo = (await req.json()) as CorpoPedido;
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
  }

  const { tipo, nome, whatsapp, email, cpf, quantidade } = corpo;

  if (!tipo || !(tipo in INGRESSOS)) {
    return NextResponse.json({ error: "Tipo de ingresso inválido" }, { status: 400 });
  }
  if (!nome || !whatsapp || !email || !cpf) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const qtd = parseInt(String(quantidade), 10) || 0;
  if (qtd < 1 || qtd > REGRAS_PEDIDO.quantidadeMaxima) {
    return NextResponse.json(
      { error: `Quantidade deve ser entre 1 e ${REGRAS_PEDIDO.quantidadeMaxima}` },
      { status: 400 },
    );
  }

  const cpfLimpo = String(cpf).replace(/\D/g, "");
  if (cpfLimpo.length !== 11) {
    return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
  }

  const tipoIngresso = tipo as TipoIngresso;
  const categoria = INGRESSOS[tipoIngresso];

  try {
    const kv = getRedis();
    await liberarExpirados(kv);

    const vendidosPorLote = await lerVendidos(kv, tipoIngresso);

    if (limiteTotalAtingido(categoria, totalVendidoCategoria(vendidosPorLote))) {
      return NextResponse.json(
        { error: `${categoria.nome} esgotado — vendas apenas na porta.` },
        { status: 400 },
      );
    }

    const lote = loteAtivo(categoria, vendidosPorLote);
    if (!lote) {
      return NextResponse.json(
        { error: `${categoria.nome} esgotado online — vendas apenas na porta.` },
        { status: 400 },
      );
    }

    const reserva = await reservarEstoque(kv, tipoIngresso, lote.numero, qtd);
    if (!reserva.ok) {
      return NextResponse.json(
        {
          error:
            reserva.restantes > 0
              ? `Só restam ${reserva.restantes} unidade(s) no lote atual.`
              : "Esse lote acabou de esgotar. Atualize a página.",
        },
        { status: 400 },
      );
    }

    const total = lote.preco * qtd;
    const codigo = await gerarCodigoPedido(kv);

    let mpData: {
      id?: number;
      status?: string;
      message?: string;
      cause?: { description?: string }[];
      point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } };
    };

    try {
      const response = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          "X-Idempotency-Key": `rrlounge-${codigo}`,
        },
        body: JSON.stringify({
          transaction_amount: total,
          description: `${EVENTO.nome} — ${qtd}x ${categoria.nome} (lote ${lote.numero})`,
          payment_method_id: "pix",
          date_of_expiration: new Date(
            Date.now() + REGRAS_PEDIDO.reservaMinutos * 60 * 1000,
          ).toISOString(),
          payer: {
            email,
            first_name: nome.split(" ")[0],
            last_name: nome.split(" ").slice(1).join(" ") || "-",
            identification: { type: "CPF", number: cpfLimpo },
          },
          notification_url: `${SEO.siteUrl}/api/webhook-pix`,
          metadata: {
            evento: "rrlounge",
            codigo,
            tipo: tipoIngresso,
            lote_numero: lote.numero,
            quantidade: qtd,
          },
        }),
      });

      mpData = await response.json();

      if (!response.ok) {
        console.error("MP error status:", response.status, JSON.stringify(mpData));
        await liberarReserva(kv, tipoIngresso, lote.numero, qtd);
        return NextResponse.json(
          {
            error: "Falha na criação da cobrança",
            detalhe: mpData?.message || mpData?.cause?.[0]?.description || "Erro desconhecido",
          },
          { status: 500 },
        );
      }
    } catch (mpErr) {
      await liberarReserva(kv, tipoIngresso, lote.numero, qtd);
      throw mpErr;
    }

    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code || "";
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || "";

    if (!qrCode) {
      console.error("QR Code não retornado pelo MP:", JSON.stringify(mpData));
      await liberarReserva(kv, tipoIngresso, lote.numero, qtd);
      return NextResponse.json(
        { error: "QR Code Pix não gerado. Verifique as credenciais do Mercado Pago." },
        { status: 500 },
      );
    }

    const agora = Date.now();
    const expiraEm = agora + REGRAS_PEDIDO.reservaMinutos * 60 * 1000;

    await salvarPedido(kv, {
      codigo,
      tipo: tipoIngresso,
      loteNumero: lote.numero,
      quantidade: qtd,
      precoUnitario: lote.preco,
      total,
      nome,
      whatsapp,
      email,
      cpf: cpfLimpo,
      status: "pendente",
      paymentId: mpData.id!,
      criadoEm: agora,
      expiraEm,
    });
    await marcarComoPendente(kv, codigo, expiraEm);

    return NextResponse.json({
      id: mpData.id,
      codigo,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      status: mpData.status,
      total,
      expiraEm,
    });
  } catch (err) {
    console.error("Erro interno em criar-pix:", err);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
