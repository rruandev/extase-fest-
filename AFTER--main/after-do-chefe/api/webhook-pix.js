// api/webhook-pix.js
import { EVENTO, INGRESSOS, REGRAS_PEDIDO } from '../config/evento.js';
import { getRedis, lerPedido, atualizarPedido, liberarReserva, removerDosPendentes } from '../lib/estoque.js';

const kv = getRedis();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, action, data } = req.body || {};

  const isPayment = type === 'payment' || action === 'payment.updated' || action === 'payment.created';
  if (!isPayment) {
    return res.status(200).json({ ok: true });
  }

  if (!data?.id || data.id === '123456') {
    return res.status(200).json({ ok: true, msg: 'teste ignorado' });
  }

  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });
    const payment = await mpRes.json();

    if (!mpRes.ok) {
      console.error('MP error ao buscar pagamento:', JSON.stringify(payment));
      return res.status(200).json({ ok: true });
    }

    const codigo = payment.metadata?.codigo;
    if (!codigo) {
      console.error('Pagamento sem código de pedido na metadata:', JSON.stringify(payment.metadata));
      return res.status(200).json({ ok: true, erro: 'metadata incompleta' });
    }

    const pedido = await lerPedido(kv, codigo);
    if (!pedido) {
      console.error('Pedido não encontrado para código:', codigo);
      return res.status(200).json({ ok: true, erro: 'pedido não encontrado' });
    }

    // Já processamos esse pedido antes (webhook pode repetir a notificação) — não reprocessa.
    if (pedido.status !== 'pendente') {
      return res.status(200).json({ ok: true, status: pedido.status });
    }

    if (payment.status === 'approved') {
      await removerDosPendentes(kv, codigo);
      const atualizado = await atualizarPedido(kv, codigo, { status: 'confirmado', confirmadoEm: Date.now() });
      await enviarEmailConfirmacao(atualizado);
      return res.status(200).json({ ok: true, status: 'confirmado' });
    }

    if (payment.status === 'rejected' || payment.status === 'cancelled') {
      await liberarReserva(kv, pedido.tipo, pedido.loteNumero, pedido.quantidade);
      await removerDosPendentes(kv, codigo);
      await atualizarPedido(kv, codigo, { status: 'cancelado' });
      return res.status(200).json({ ok: true, status: 'cancelado' });
    }

    // pending / in_process — continua reservado, sem mudança.
    return res.status(200).json({ ok: true, status: payment.status });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

async function enviarEmailConfirmacao(pedido) {
  const categoria = INGRESSOS[pedido.tipo];
  const qtd = pedido.quantidade;
  const precoPorIngresso = pedido.total / qtd;

  const dataEvento = new Date(EVENTO.dataISO);
  const dataFormatada = dataEvento.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const horaFormatada = dataEvento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const codigos = [];
  for (let i = 0; i < qtd; i++) {
    codigos.push(`${REGRAS_PEDIDO.prefixoIngresso}${pedido.codigo}-${String(i + 1).padStart(2, '0')}`);
  }

  const ingressosHtml = codigos.map((codigo, i) => `
    <div style="background:#1A1613;border-radius:16px;padding:1.5rem;color:#EDE6DA;margin-bottom:1rem">
      <p style="font-size:10px;color:rgba(237,230,218,0.5);text-transform:uppercase;letter-spacing:.08em;margin:0 0 4px">
        POEIRA ${qtd > 1 ? '— Ingresso ' + (i + 1) + ' de ' + qtd : ''}
      </p>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <p style="font-size:22px;font-weight:700;margin:0">${categoria.nome}</p>
        <p style="font-size:20px;font-weight:700;margin:0;color:#B08D57">R$ ${precoPorIngresso.toFixed(2).replace('.', ',')}</p>
      </div>
      <hr style="border:none;border-top:1.5px dashed rgba(237,230,218,0.2);margin:0 0 1rem">
      <div style="display:flex;align-items:center;gap:1rem">
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(codigo + '|' + pedido.nome + '|POEIRA|' + EVENTO.dataISO)}"
          width="80" height="80"
          style="border-radius:8px;background:#fff"
          alt="QR Code"
        >
        <div>
          <p style="font-size:14px;font-weight:600;margin:0 0 3px">${pedido.nome}</p>
          <p style="font-size:12px;color:rgba(237,230,218,0.6);margin:0">${dataFormatada}, ${horaFormatada}</p>
          <p style="font-size:12px;color:rgba(237,230,218,0.6);margin:2px 0">Sobradinho, DF</p>
          <p style="font-size:10px;color:rgba(237,230,218,0.35);font-family:monospace;margin:6px 0 0">${codigo}</p>
        </div>
      </div>
    </div>
  `).join('');

  const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0E0C0A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:2rem 1rem">
    <div style="text-align:center;margin-bottom:1.5rem">
      <h1 style="font-size:26px;font-weight:800;color:#EDE6DA;margin:0;letter-spacing:-1px;text-transform:uppercase">POEIRA</h1>
      <p style="font-size:13px;color:#8F857A;margin:.4rem 0 0">${qtd > 1 ? qtd + ' ingressos confirmados' : 'Ingresso confirmado'}</p>
    </div>
    <div style="background:#1A1613;border-radius:16px;padding:1.5rem;margin-bottom:1rem;border:1px solid rgba(237,230,218,0.08)">
      <p style="font-size:13px;color:#8F857A;margin:0 0 .5rem">Olá, <strong style="color:#EDE6DA">${pedido.nome}</strong>!</p>
      <p style="font-size:14px;color:#EDE6DA;line-height:1.6">
        Pagamento confirmado. ${qtd > 1 ? 'Abaixo estão seus ' + qtd + ' ingressos digitais' : 'Abaixo está seu ingresso digital'}. Apresente o QR Code na entrada.
      </p>
    </div>
    ${ingressosHtml}
    <div style="background:#1A1613;border-radius:12px;padding:1.25rem;border:1px solid rgba(237,230,218,0.08);margin-bottom:1rem">
      <p style="font-size:13px;font-weight:600;color:#EDE6DA;margin:0 0 .75rem">Informações do evento</p>
      <table style="width:100%;font-size:13px;border-collapse:collapse;color:#EDE6DA">
        <tr><td style="color:#8F857A;padding:4px 0">Data</td><td style="text-align:right;font-weight:500">${dataFormatada}</td></tr>
        <tr><td style="color:#8F857A;padding:4px 0">Horário</td><td style="text-align:right;font-weight:500">${horaFormatada}</td></tr>
        <tr><td style="color:#8F857A;padding:4px 0">Local</td><td style="text-align:right;font-weight:500">Sobradinho, DF</td></tr>
        <tr><td style="color:#8F857A;padding:4px 0">Ingresso</td><td style="text-align:right;font-weight:500">${categoria.nome}</td></tr>
        <tr><td style="color:#8F857A;padding:4px 0">Quantidade</td><td style="text-align:right;font-weight:500">${qtd}</td></tr>
      </table>
    </div>
    <p style="font-size:12px;color:#8F857A;text-align:center;margin-top:1.5rem">
      Dúvidas? Chama no WhatsApp de suporte.<br>
      <strong>Não transfira este ingresso</strong> — ele é nominal e vinculado ao seu CPF.
    </p>
  </div>
</body>
</html>`;

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'POEIRA <ingressos@extasefest.com.br>',
      to: pedido.email,
      subject: `${qtd > 1 ? qtd + ' ingressos confirmados' : 'Ingresso confirmado'} — POEIRA (${categoria.nome})`,
      html: emailHtml,
    }),
  });

  const emailData = await emailRes.json();
  if (!emailRes.ok) {
    console.error('Resend error:', JSON.stringify(emailData));
  } else {
    console.log('Email enviado para:', pedido.email, '| ID:', emailData.id);
  }
}
