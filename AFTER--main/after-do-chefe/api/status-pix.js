// api/status-pix.js
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'ID do pagamento não informado' });
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    return res.status(500).json({ error: 'Configuração do servidor incompleta' });
  }

  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { 'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}` }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MP status error:', response.status, JSON.stringify(data));
      return res.status(500).json({ error: 'Erro ao consultar pagamento' });
    }

    return res.status(200).json({
      id: data.id,
      status: data.status
    });

  } catch (err) {
    console.error('Erro ao consultar pagamento:', err);
    return res.status(500).json({ error: 'Erro ao consultar status' });
  }
}
