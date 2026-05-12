# Êxtase Fest — Site de Ingressos

Site de venda de ingressos com pagamento Pix via Mercado Pago e envio automático por email.

---

## Como colocar no ar (passo a passo)

### 1. Criar conta no Resend (envio de email — gratuito)

1. Acesse https://resend.com e crie uma conta gratuita
2. Vá em **API Keys** → **Create API Key** → copie a chave
3. Guarde como: `RESEND_API_KEY = re_xxxxxxxxxxxx`

> Para testes, você pode usar `from: onboarding@resend.dev` sem precisar de domínio próprio.
> Para produção, adicione e verifique seu domínio no Resend.

---

### 2. Pegar as credenciais do Mercado Pago

1. Acesse https://www.mercadopago.com.br/developers/panel
2. Vá em **Suas integrações** → **Criar aplicação**
3. Copie:
   - **Public Key** (começa com `APP_USR-...`) → vai no `index.html`
   - **Access Token** (começa com `APP_USR-...`) → vai como variável de ambiente

---

### 3. Subir o código no GitHub

1. Crie um repositório em https://github.com/new
2. Faça upload de todos os arquivos desta pasta
   ```
   extase-fest/
   ├── public/
   │   └── index.html
   ├── api/
   │   ├── criar-pix.js
   │   ├── status-pix.js
   │   └── webhook-pix.js
   └── vercel.json
   ```

---

### 4. Deploy na Vercel (gratuito)

1. Acesse https://vercel.com e crie conta com seu GitHub
2. Clique em **Add New Project** → importe seu repositório
3. Vá em **Settings → Environment Variables** e adicione:

   | Nome | Valor |
   |------|-------|
   | `MP_ACCESS_TOKEN` | Seu Access Token do Mercado Pago |
   | `RESEND_API_KEY` | Sua API Key do Resend |
   | `SITE_URL` | URL do seu site (ex: `https://afterdochefe.vercel.app`) |

4. Clique em **Deploy** — seu site estará no ar em ~1 minuto!

---

### 5. Configurar o webhook no Mercado Pago

1. No painel do Mercado Pago → **Webhooks**
2. Adicione a URL: `https://SEU-SITE.vercel.app/api/webhook-pix`
3. Marque o evento: **Pagamentos**
4. Salve

---

### 6. Atualizar a Public Key no index.html

Abra `public/index.html` e substitua na linha:
```js
const MP_PUBLIC_KEY = 'SUA_PUBLIC_KEY_AQUI';
```
pela sua chave pública do Mercado Pago.

---

## Estrutura dos arquivos

| Arquivo | O que faz |
|---------|-----------|
| `public/index.html` | Site completo com formulário e fluxo de compra |
| `api/criar-pix.js` | Cria a cobrança Pix no Mercado Pago |
| `api/status-pix.js` | Verifica se o pagamento foi confirmado |
| `api/webhook-pix.js` | Recebe confirmação do MP e envia o ingresso por email |
| `vercel.json` | Configuração de rotas da Vercel |

---

## Fluxo completo

```
Comprador preenche dados
       ↓
Clica em "Gerar Pix"
       ↓
/api/criar-pix → Mercado Pago cria cobrança → retorna QR Code
       ↓
Comprador escaneia e paga
       ↓
Mercado Pago chama /api/webhook-pix
       ↓
Webhook confirma pagamento → Resend envia email com ingresso
       ↓
Site detecta pagamento aprovado → mostra ingresso na tela
```

---

## Dúvidas frequentes

**Posso testar sem pagar de verdade?**
Sim! Use as credenciais de **sandbox** do Mercado Pago (aba "Credenciais de teste" no painel).

**O email não chega?**
Verifique se a `RESEND_API_KEY` está correta e se o remetente está configurado no Resend.

**Como trocar os lotes ou preços?**
Edite o objeto `LOTES` no `index.html`:
```js
const LOTES = {
  1: { nome: '1º Lote', preco: 15, vagas: 50 },
  2: { nome: '2º Lote', preco: 20, vagas: 50 },
  3: { nome: '3º Lote', preco: 25, vagas: 50 }
};
```
