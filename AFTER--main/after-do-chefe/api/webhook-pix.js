// api/webhook-pix.js
import { Redis } from '@upstash/redis';
const kv = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });

const TOTAL_VAGAS = { 1: 50, 2: 100, 3: 150 };
const LOTE_NOMES  = { '1º Lote': 1, '2º Lote': 2, '3º Lote': 3 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, action, data } = req.body;

  // Aceita tanto type=payment quanto action=payment.updated/created
  const isPayment = type === 'payment' || action === 'payment.updated' || action === 'payment.created';
  if (!isPayment) {
    return res.status(200).json({ ok: true });
  }

  // Ignora ID de teste
  if (!data?.id || data.id === '123456') {
    return res.status(200).json({ ok: true, msg: 'teste ignorado' });
  }

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });
    const payment = await mpRes.json();

    if (!mpRes.ok) {
      console.error('MP error ao buscar pagamento:', JSON.stringify(payment));
      return res.status(200).json({ ok: true });
    }

    if (payment.status !== 'approved') {
      console.log('Pagamento não aprovado:', payment.status);
      return res.status(200).json({ ok: true, status: payment.status });
    }

    const { comprador_nome, comprador_email, lote, quantidade } = payment.metadata || {};

    // ── Decrementa vagas no KV ──
    try {
      const loteNum = LOTE_NOMES[lote];
      if (loteNum) {
        const qtd = parseInt(quantidade) || 1;
        const vagasKey = `vagas:${loteNum}`;
        const vagasAtual = await kv.get(vagasKey);
        const vagasAtuais = vagasAtual === null ? TOTAL_VAGAS[loteNum] : parseInt(vagasAtual);
        const novasVagas = Math.max(0, vagasAtuais - qtd);
        await kv.set(vagasKey, novasVagas);
        console.log(`Vagas ${lote}: ${vagasAtuais} → ${novasVagas}`);
      }
    } catch (kvErr) {
      console.warn('KV decrement falhou:', kvErr.message);
    }

    if (!comprador_email) {
      console.error('Metadata incompleta:', JSON.stringify(payment.metadata));
      return res.status(200).json({ ok: true, erro: 'metadata incompleta' });
    }

    const valor = payment.transaction_amount;
    const qtd = parseInt(quantidade) || 1;
    const precoPorIngresso = valor / qtd;

    // Gera um código único por ingresso
    const codigos = [];
    for (let i = 0; i < qtd; i++) {
      codigos.push('#AC2026-' + payment.id.toString().slice(-4) + String(i + 1).padStart(2, '0'));
    }

    // Monta cards de ingresso para o email
    const ingressosHtml = codigos.map((codigo, i) => `
      <div style="background:#0d0d1a;border-radius:16px;padding:1.5rem;color:#fff;margin-bottom:1rem">
        <p style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:.08em;margin:0 0 4px">
          Êxtase Fest ${qtd > 1 ? '— Ingresso ' + (i+1) + ' de ' + qtd : ''}
        </p>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
          <p style="font-size:22px;font-weight:700;margin:0">${lote}</p>
          <p style="font-size:20px;font-weight:700;margin:0">R$ ${precoPorIngresso.toFixed(2).replace('.', ',')}</p>
        </div>
        <hr style="border:none;border-top:1.5px dashed rgba(255,255,255,0.2);margin:0 0 1rem">
        <div style="display:flex;align-items:center;gap:1rem">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(codigo + '|' + comprador_nome + '|Êxtase Fest|06/06/2026')}"
            width="80" height="80"
            style="border-radius:8px;background:#fff"
            alt="QR Code"
          >
          <div>
            <p style="font-size:14px;font-weight:600;margin:0 0 3px">${comprador_nome}</p>
            <p style="font-size:12px;color:rgba(255,255,255,0.55);margin:0">Sáb, 06 Jun 2026 • 21h30</p>
            <p style="font-size:12px;color:rgba(255,255,255,0.55);margin:2px 0">Brasília, DF</p>
            <p style="font-size:10px;color:rgba(255,255,255,0.3);font-family:monospace;margin:6px 0 0">${codigo}</p>
          </div>
        </div>
      </div>
    `).join('');

    const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:2rem 1rem">
    <div style="text-align:center;margin-bottom:1.5rem">
      <p style="font-size:28px;margin-bottom:.5rem">🇧🇷</p>
      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0">Êxtase Fest</h1>
      <p style="font-size:13px;color:#888;margin:.4rem 0 0">${qtd > 1 ? qtd + ' ingressos confirmados!' : 'Ingresso confirmado!'}</p>
    </div>
    <div style="background:#fff;border-radius:16px;padding:1.5rem;margin-bottom:1rem;border:1px solid #e8e8e4">
      <p style="font-size:13px;color:#888;margin:0 0 .5rem">Olá, <strong style="color:#1a1a1a">${comprador_nome}</strong>!</p>
      <p style="font-size:14px;color:#555;line-height:1.6">
        Seu pagamento foi confirmado! ${qtd > 1 ? 'Abaixo estão seus ' + qtd + ' ingressos digitais' : 'Abaixo está seu ingresso digital'} para o <strong>Êxtase Fest</strong>. Apresente o QR Code na entrada.
      </p>
    </div>
    ${ingressosHtml}
    <div style="background:#fff;border-radius:12px;padding:1.25rem;border:1px solid #e8e8e4;margin-bottom:1rem">
      <p style="font-size:13px;font-weight:600;color:#333;margin:0 0 .75rem">Informações do evento</p>
      <table style="width:100%;font-size:13px;border-collapse:collapse">
        <tr><td style="color:#888;padding:4px 0">Data</td><td style="text-align:right;font-weight:500">Sábado, 06 de Junho de 2026</td></tr>
        <tr><td style="color:#888;padding:4px 0">Horário</td><td style="text-align:right;font-weight:500">21h30</td></tr>
        <tr><td style="color:#888;padding:4px 0">Local</td><td style="text-align:right;font-weight:500">Brasília, DF</td></tr>
        <tr><td style="color:#888;padding:4px 0">Lote</td><td style="text-align:right;font-weight:500">${lote}</td></tr>
        <tr><td style="color:#888;padding:4px 0">Quantidade</td><td style="text-align:right;font-weight:500">${qtd} ingresso${qtd > 1 ? 's' : ''}</td></tr>
      </table>
    </div>
    <p style="font-size:12px;color:#aaa;text-align:center;margin-top:1.5rem">
      Dúvidas? Entre em contato pelo WhatsApp.<br>
      <strong>Não transfira este ingresso</strong> — ele é nominal e vinculado ao seu CPF.
    </p>
  </div>
</body>
</html>`;

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Êxtase Fest <ingressos@extasefest.com.br>',
        to: comprador_email,
        subject: `🎉 ${qtd > 1 ? qtd + ' ingressos confirmados' : 'Ingresso confirmado'} — Êxtase Fest (${lote})`,
        html: emailHtml
      })
    });

    const emailData = await emailRes.json();

    if (!emailRes.ok) {
      console.error('Resend error:', JSON.stringify(emailData));
    } else {
      console.log('Email enviado com sucesso para:', comprador_email, '| ID:', emailData.id);
    }

    return res.status(200).json({ ok: true, codigos });

  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}
