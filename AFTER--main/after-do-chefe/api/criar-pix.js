// api/criar-pix.js
// Vercel Serverless Function
import { INGRESSOS, REGRAS_PEDIDO, calcularStatusLotes, loteAtivo, limiteTotalAtingido } from '../config/evento.js';
import { getRedis, lerVendidos, totalVendidoCategoria, reservarEstoque, liberarReserva, gerarCodigoPedido, salvarPedido, marcarComoPendente, liberarExpirados } from '../lib/estoque.js';

const kv = getRedis();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.MP_ACCESS_TOKEN) {
    console.error('MP_ACCESS_TOKEN não configurado');
    return res.status(500).json({ error: 'Configuração do servidor incompleta' });
  }

  const { tipo, nome, whatsapp, email, cpf, quantidade } = req.body || {};

  if (!tipo || !INGRESSOS[tipo]) {
    return res.status(400).json({ error: 'Tipo de ingresso inválido' });
  }
  if (!nome || !whatsapp || !email || !cpf) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const qtd = parseInt(quantidade, 10) || 0;
  if (qtd < 1 || qtd > REGRAS_PEDIDO.quantidadeMaxima) {
    return res.status(400).json({ error: `Quantidade deve ser entre 1 e ${REGRAS_PEDIDO.quantidadeMaxima}` });
  }

  const cpfLimpo = String(cpf).replace(/\D/g, '');
  if (cpfLimpo.length !== 11) {
    return res.status(400).json({ error: 'CPF inválido' });
  }

  const categoria = INGRESSOS[tipo];

  try {
    await liberarExpirados(kv);

    const vendidosPorLote = await lerVendidos(kv, tipo);

    if (limiteTotalAtingido(categoria, totalVendidoCategoria(vendidosPorLote))) {
      return res.status(400).json({ error: `${categoria.nome} esgotado — vendas apenas na porta.` });
    }

    const lote = loteAtivo(categoria, vendidosPorLote);
    if (!lote) {
      return res.status(400).json({ error: `${categoria.nome} esgotado online — vendas apenas na porta.` });
    }

    // Preço nunca vem do cliente — sempre calculado aqui a partir do lote ativo real.
    const reserva = await reservarEstoque(kv, tipo, lote.numero, qtd);
    if (!reserva.ok) {
      return res.status(400).json({
        error: reserva.restantes > 0
          ? `Só restam ${reserva.restantes} unidade(s) no lote atual.`
          : 'Esse lote acabou de esgotar. Atualize a página.',
      });
    }

    const total = lote.preco * qtd;
    const codigo = await gerarCodigoPedido(kv);

    let mpData;
    try {
      const response = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          'X-Idempotency-Key': `poeira-${codigo}`,
        },
        body: JSON.stringify({
          transaction_amount: total,
          description: `POEIRA — ${qtd}x ${categoria.nome} (lote ${lote.numero})`,
          payment_method_id: 'pix',
          date_of_expiration: new Date(Date.now() + REGRAS_PEDIDO.reservaMinutos * 60 * 1000).toISOString(),
          payer: {
            email,
            first_name: nome.split(' ')[0],
            last_name: nome.split(' ').slice(1).join(' ') || '-',
            identification: { type: 'CPF', number: cpfLimpo },
          },
          notification_url: 'https://extasefest.com.br/api/webhook-pix',
          metadata: {
            evento: 'poeira',
            codigo,
            tipo,
            lote_numero: lote.numero,
            quantidade: qtd,
          },
        }),
      });

      mpData = await response.json();

      if (!response.ok) {
        console.error('MP error status:', response.status, JSON.stringify(mpData));
        await liberarReserva(kv, tipo, lote.numero, qtd);
        return res.status(500).json({
          error: 'Falha na criação da cobrança',
          detalhe: mpData?.message || mpData?.cause?.[0]?.description || 'Erro desconhecido',
        });
      }
    } catch (mpErr) {
      await liberarReserva(kv, tipo, lote.numero, qtd);
      throw mpErr;
    }

    const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code || '';
    const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64 || '';

    if (!qrCode) {
      console.error('QR Code não retornado pelo MP:', JSON.stringify(mpData));
      await liberarReserva(kv, tipo, lote.numero, qtd);
      return res.status(500).json({ error: 'QR Code Pix não gerado. Verifique as credenciais do Mercado Pago.' });
    }

    const agora = Date.now();
    const expiraEm = agora + REGRAS_PEDIDO.reservaMinutos * 60 * 1000;

    await salvarPedido(kv, {
      codigo,
      tipo,
      loteNumero: lote.numero,
      quantidade: qtd,
      precoUnitario: lote.preco,
      total,
      nome,
      whatsapp,
      email,
      cpf: cpfLimpo,
      status: 'pendente',
      paymentId: mpData.id,
      criadoEm: agora,
      expiraEm,
    });
    await marcarComoPendente(kv, codigo, expiraEm);

    return res.status(200).json({
      id: mpData.id,
      codigo,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      status: mpData.status,
      total,
      expiraEm,
    });
  } catch (err) {
    console.error('Erro interno em criar-pix:', err);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
