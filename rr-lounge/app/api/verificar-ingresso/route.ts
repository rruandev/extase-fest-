// POST /api/verificar-ingresso — usado pelo verificador na portaria.
// Protegido por SENHA_PORTEIRO. A validação é de uso único: o SET com { nx: true }
// só grava se a chave ainda não existir, então o segundo scan do mesmo QR falha.

import { NextResponse } from "next/server";
import { REGRAS_PEDIDO } from "@/config/evento";
import { getRedis } from "@/lib/estoque";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: Request) {
  const cors = { "Access-Control-Allow-Origin": "*" };

  let corpo: { codigo?: string; senha?: string };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ valido: false, erro: "Requisição inválida" }, { status: 400, headers: cors });
  }

  const { codigo, senha } = corpo;

  if (!senha || senha !== process.env.SENHA_PORTEIRO) {
    return NextResponse.json(
      { valido: false, erro: "Acesso não autorizado" },
      { status: 401, headers: cors },
    );
  }

  if (!codigo) {
    return NextResponse.json(
      { valido: false, erro: "Código não informado" },
      { status: 400, headers: cors },
    );
  }

  // Teste de autenticação, sem código real.
  if (codigo === "TEST") {
    return NextResponse.json({ ok: true }, { headers: cors });
  }

  const partes = codigo.split("|");
  const codigoIngresso = partes[0];
  const nomeComprador = partes[1] || "—";
  const evento = partes[2] || "—";
  const data = partes[3] || "—";

  if (!codigoIngresso.startsWith(REGRAS_PEDIDO.prefixoIngresso)) {
    return NextResponse.json(
      { valido: false, erro: "QR Code inválido — não pertence a este evento" },
      { headers: cors },
    );
  }

  try {
    const kv = getRedis();
    const inserido = await kv.set(`ingresso:${codigoIngresso}`, Date.now(), { nx: true });

    if (inserido === null) {
      return NextResponse.json(
        { valido: false, erro: "Ingresso já utilizado", codigo: codigoIngresso, nome: nomeComprador },
        { headers: cors },
      );
    }

    return NextResponse.json(
      { valido: true, codigo: codigoIngresso, nome: nomeComprador, evento, data },
      { headers: cors },
    );
  } catch (err) {
    console.error("Erro ao verificar ingresso:", err);
    return NextResponse.json(
      { valido: false, erro: "Erro interno ao verificar ingresso" },
      { status: 500, headers: cors },
    );
  }
}
