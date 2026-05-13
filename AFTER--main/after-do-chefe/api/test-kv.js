// api/test-kv.js — diagnóstico temporário do Redis
import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url  = process.env.UPSTASH_REDIS_REST_URL  || '(NÃO DEFINIDA)';
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || '(NÃO DEFINIDA)';

  const resultado = {
    env: {
      UPSTASH_REDIS_REST_URL:   url.startsWith('http') ? url.slice(0, 40) + '...' : url,
      UPSTASH_REDIS_REST_TOKEN: token !== '(NÃO DEFINIDA)' ? token.slice(0, 8) + '...' : token,
    },
    read: null,
    write: null,
    erro: null
  };

  if (url === '(NÃO DEFINIDA)' || token === '(NÃO DEFINIDA)') {
    resultado.erro = 'Variáveis de ambiente não configuradas no Vercel!';
    return res.status(200).json(resultado);
  }

  try {
    const kv = new Redis({ url, token });

    // Testa escrita
    await kv.set('teste:diagnostico', 'ok-' + Date.now());
    resultado.write = 'SUCESSO';

    // Testa leitura
    const val = await kv.get('teste:diagnostico');
    resultado.read = val ? 'SUCESSO (' + val + ')' : 'FALHOU (retornou null)';

    // Mostra vagas atuais
    const [v1, v2, v3] = await Promise.all([
      kv.get('vagas:1'),
      kv.get('vagas:2'),
      kv.get('vagas:3'),
    ]);
    resultado.vagas_no_redis = { 'vagas:1': v1, 'vagas:2': v2, 'vagas:3': v3 };

  } catch (err) {
    resultado.erro = err.message;
    resultado.write = 'FALHOU';
  }

  return res.status(200).json(resultado);
}
