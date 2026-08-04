// GET /api/status-pix?id=... — consulta o status de um pagamento no Mercado Pago.
// O front faz polling aqui a cada 4s enquanto o Pix está aberto; a confirmação
// definitiva (e o e-mail) continua acontecendo no webhook.

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID do pagamento não informado" }, { status: 400 });
  }
  if (!process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json({ error: "Configuração do servidor incompleta" }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("MP status error:", response.status, JSON.stringify(data));
      return NextResponse.json({ error: "Erro ao consultar pagamento" }, { status: 500 });
    }

    return NextResponse.json(
      { id: data.id, status: data.status },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("Erro ao consultar pagamento:", err);
    return NextResponse.json({ error: "Erro ao consultar status" }, { status: 500 });
  }
}
