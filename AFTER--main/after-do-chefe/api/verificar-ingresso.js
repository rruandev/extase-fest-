import { Redis } from '@upstash/redis';
import { REGRAS_PEDIDO } from '../config/evento.js';

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { codigo, senha } = req.body;

  // Verifica senha — retorna 401 sempre que errada ou ausente
  if (!senha || senha !== process.env.SENHA_PORTEIRO) {
    return res.status(401).json({ valido: false, erro: 'Acesso não autorizado' });
  }

  if (!codigo) {
    return res.status(400).json({ valido: false, erro: 'Código não informado' });
  }

  // Teste de autenticação (sem código real)
  if (codigo === 'TEST') {
    return res.status(200).json({ ok: true });
  }

  const partes = codigo.split('|');
  const codigoIngresso = partes[0];
  const nomeComprador = partes[1] || '—';
  const evento = partes[2] || '—';
  const data = partes[3] || '—';

  if (!codigoIngresso.startsWith(REGRAS_PEDIDO.prefixoIngresso)) {
    return res.status(200).json({
      valido: false,
      erro: 'QR Code inválido — não pertence a este evento'
    });
  }

  try {
    const inserido = await kv.set(`ingresso:${codigoIngresso}`, Date.now(), { nx: true });

    if (inserido === null) {
      return res.status(200).json({
        valido: false,
        erro: 'Ingresso já utilizado',
        codigo: codigoIngresso,
        nome: nomeComprador
      });
    }

    return res.status(200).json({
      valido: true,
      codigo: codigoIngresso,
      nome: nomeComprador,
      evento,
      data
    });
  } catch (err) {
    console.error('Erro ao verificar ingresso:', err);
    return res.status(500).json({ valido: false, erro: 'Erro interno ao verificar ingresso' });
  }
}
