// api/vagas.js — retorna vagas disponíveis por lote
import { Redis } from '@upstash/redis';
import { TOTAL_VAGAS } from './_lib.js';

const kv = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');

  try {
    const [v1, v2, v3] = await Promise.all([
      kv.get('vagas:1'),
      kv.get('vagas:2'),
      kv.get('vagas:3'),
    ]);

    // Se nunca inicializou, usa o total
    const vagas = {
      1: v1 === null ? TOTAL_VAGAS[1] : parseInt(v1),
      2: v2 === null ? TOTAL_VAGAS[2] : parseInt(v2),
      3: v3 === null ? TOTAL_VAGAS[3] : parseInt(v3),
    };

    return res.status(200).json({ vagas });
  } catch (err) {
    console.error('Erro ao buscar vagas:', err);
    // Fallback: retorna total para não bloquear o site
    return res.status(200).json({ vagas: TOTAL_VAGAS });
  }
}
