# 🚀 Deploy do DEALWAR na Vercel (grátis)

> O build de produção já foi testado e passa limpo (`npm run build`). Basta seguir os passos.

## 1. Publicar no GitHub

1. github.com → **New repository** → nome `dealwar` → **Private** → Create
2. Na página do repo vazio: clica **"uploading an existing file"**
3. Arrasta TODOS os ficheiros desta pasta (⚠️ sem `node_modules` — nem sequer existe aqui)
4. **Commit changes**

> Se o GitHub reclamar do número de ficheiros, arrasta pasta a pasta (primeiro `src`, depois o resto).

## 2. Deploy na Vercel

1. vercel.com → entra **com GitHub** ("Continue with GitHub")
2. **Add New → Project** → Import `dealwar`
3. Framework: **Vite** (deteção automática) — não mudes build settings
4. **Antes do Deploy**, em *Environment Variables* adiciona UMA variável:

   ```
   VITE_CONVEX_URL = https://giant-toad-89.convex.cloud
   ```

5. **Deploy** → ~1 minuto → ficas com `https://dealwar-XXX.vercel.app`

## 3. Verificar

- [ ] Landing abre com guerras demo
- [ ] `/wars` abre uma guerra
- [ ] Entras como convidado (guest) e submetes um preço
- [ ] `/business` mostra o formulário de patrocínio e o MB Way

## 4. Atualizar o site mais tarde

Edita qualquer ficheiro no GitHub (lápis ✏️ → edita → Commit) — a Vercel **publica sozinha** em ~1 min.

---

### Se algo falhar

| Erro provável | Causa | Solução |
|---|---|---|
| Ecrã branco + mensagem sobre `VITE_CONVEX_URL` | Esqueceste a env var | Vercel → Settings → Environment Variables → adiciona → **Redeploy** |
| "Cannot find module …" no build log | Ficheiro ficou fora do upload | Repara no caminho no log e volta a arrastar esse ficheiro para o GitHub |
| Páginas dão 404 ao recarregar | `vercel.json` em falta | Confirma que `vercel.json` foi enviado (está na raiz) |

### Backend (Convex) — já está pronto

O frontend fala com o Convex existente (`giant-toad-89.convex.cloud`). **Nada para configurar** — o mesmo backend serve o preview e a Vercel.

> ℹ️ Mais tarde, se quiseres um deployment Convex separado só para produção, cria em dashboard.convex.dev e muda a env var. Para começar, partilhar é perfeitamente seguro.

## 💳 Ativar pagamentos Stripe (opcional, 10 min)

Sem Stripe, o site funciona na mesma — os pagamentos caem no MB Way +351 927 220 303 e registas em `/owner`.

Para cobrar online automaticamente:

1. **Conta** em dashboard.stripe.com (precisas de IBAN para receber)
2. **API keys** (Developers → API keys) → copia a *Secret key* (`sk_live_…`)
3. **Cola a chave na plataforma** onde desenvolves (Keys/API keys) e na **Vercel** (Environment Variables):
   ```
   STRIPE_SECRET_KEY = sk_live_…
   ```
4. **Webhook** (Developers → Webhooks → Add endpoint):
   - URL: `https://giant-toad-89.convex.site/stripe/webhook`
   - Evento: `checkout.session.completed`
   - Copia o *Signing secret* (`whsec_…`) → adiciona também:
   ```
   STRIPE_WEBHOOK_SECRET = whsec_…
   ```
5. Testa: `/business` → escolhe pacote → Pagar com Stripe → cartão de teste `4242 4242 4242 4242` (em modo test)
6. O pagamento PAGO aparece automaticamente em `/owner` (Ganhos reais)

> Modo test primeiro (`sk_test_…`) até confirmares tudo; depois troca para live.
