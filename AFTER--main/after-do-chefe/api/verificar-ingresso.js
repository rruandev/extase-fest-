import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { codigo, senha } = req.body;

  if (senha !== process.env.SENHA_PORTEIRO) {
    return res.status(401).json({ valido: false, erro: 'Acesso não autorizado' });
  }

  if (!codigo) {
    return res.status(400).json({ valido: false, erro: 'Código não informado' });
  }

  const partes = codigo.split('|');
  const codigoIngresso = partes[0];
  const nomeComprador = partes[1] || '—';
  const evento = partes[2] || '—';
  const data = partes[3] || '—';

  if (!codigoIngresso.startsWith('#AC2026-')) {
    return res.status(200).json({
      valido: false,
      erro: 'QR Code inválido — não pertence a este evento'
    });
  }

  const inserido = await kv.setnx(`ingresso:${codigoIngresso}`, Date.now());

  if (inserido === 0) {
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
}
