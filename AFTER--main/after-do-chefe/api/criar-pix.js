// api/criar-pix.js
// Vercel Serverless Function

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verifica se o token está configurado
  if (!process.env.MP_ACCESS_TOKEN) {
    console.error('MP_ACCESS_TOKEN não configurado');
    return res.status(500).json({ error: 'Configuração do servidor incompleta' });
  }

  const { valor, nome, email, cpf, lote, quantidade } = req.body;

  if (!valor || !nome || !email || !cpf) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  // Garante que valor é número (float)
  const valorNumerico = parseFloat(valor);
  if (isNaN(valorNumerico) || valorNumerico <= 0) {
    return res.status(400).json({ error: 'Valor inválido' });
  }

  // Remove formatação do CPF
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) {
    return res.status(400).json({ error: 'CPF inválido' });
  }

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'X-Idempotency-Key': `extasefest-${cpfLimpo}-${Date.now()}`
      },
      body: JSON.stringify({
        transaction_amount: valorNumerico,
        description: `Êxtase Fest — ${quantidade}x ${lote}`,
        payment_method_id: 'pix',
        payer: {
          email: email,
          first_name: nome.split(' ')[0],
          last_name: nome.split(' ').slice(1).join(' ') || '-',
          identification: {
            type: 'CPF',
            number: cpfLimpo
          }
        },
        notification_url: 'https://afterdochefe.com.br/api/webhook-pix',
        metadata: {
          evento: 'extase-fest',
          lote,
          quantidade,
          comprador_nome: nome,
          comprador_email: email
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MP error status:', response.status);
      console.error('MP error body:', JSON.stringify(data));
      return res.status(500).json({
        error: 'Falha na criação da cobrança',
        detalhe: data?.message || data?.cause?.[0]?.description || 'Erro desconhecido'
      });
    }

    const qrCode = data.point_of_interaction?.transaction_data?.qr_code || '';
    const qrCodeBase64 = data.point_of_interaction?.transaction_data?.qr_code_base64 || '';

    if (!qrCode) {
      console.error('QR Code não retornado pelo MP:', JSON.stringify(data));
      return res.status(500).json({ error: 'QR Code Pix não gerado. Verifique as credenciais do Mercado Pago.' });
    }

    return res.status(200).json({
      id: data.id,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      status: data.status
    });

  } catch (err) {
    console.error('Erro interno em criar-pix:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
