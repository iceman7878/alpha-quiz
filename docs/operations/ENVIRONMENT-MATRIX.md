# ALPHA LAUNCH — ENVIRONMENT MATRIX (17/11/2026)

Nunca registrar valores aqui. Fonte: leitura do código (agente Infra), sem `vercel.json` nem `.env` local.

| Variável | Uso | Client/Server | Obrigatória | Production | Preview | Se faltar |
|---|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `store.ts`, `supabase-admin.ts`, rota de conteúdo | ambos | sim | ALPHA | projeto separado ou vazia | área "em configuração"; lead/webhook sem banco |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `store.ts`, rota de conteúdo | client | sim | ALPHA | idem | sem login |
| `SUPABASE_SERVICE_ROLE_KEY` | `supabase-admin.ts`, rota de conteúdo | server | sim | ALPHA | **nunca a de produção** | conteúdo 503; lead 503; `paid` 500 |
| `CHECKOUT_WEBHOOK_SECRET` | `checkout-webhook.ts` | server | sim (≥ 32) | sim | **não definir** (webhook fechado) | webhook 503 |
| `CHECKOUT_PRODUCT_IDS` | `checkout-webhook.ts` | server | sim | id do produto principal, nunca o do bump | não definir | webhook 503 |
| `CHECKOUT_SIGNATURE_SECRET` + `_HEADER` (+ `_ALGO`) | `checkout-webhook.ts` | server | opcional (juntas) | só depois que a Disrupty documentar | não definir | uma sem a outra = 503 |
| `NEXT_PUBLIC_SITE_URL` | link do convite | server | recomendada | domínio final | URL do preview | convite usa a origem da requisição |
| `NEXT_PUBLIC_CHECKOUT_URL` | `config.ts` | client | sim para vender | link da Disrupty | link de teste (opcional) | CTA leva a `/checkout-em-breve` |
| `NEXT_PUBLIC_META_PIXEL_ID` | `layout.tsx` | client | opcional | sim | **não definir** | pixel desligado |
| `NEXT_PUBLIC_MENTORSHIP_URL` | `build/score` | client | opcional | antes do 1º DAY 07 | — | BUILD 03 vê "ainda não está aberta" |
| `LEAD_WEBHOOK_URL` | `api/lead` | server | opcional | se usar automação | — | sem Supabase, lead 503 em produção |
| `NEXT_PUBLIC_DEMO` | nenhum (só testes) | — | não usada | — | — | — |

`NEXT_PUBLIC_*` entram no build: mudar exige redeploy.

## Integrações
| Sistema | Estado observado (17/11) | Dono |
|---|---|---|
| Supabase | só `anunzy` e `anunzy-dev` (não tocados); **não existe projeto da ALPHA** | Infra |
| Vercel | conector: `list_teams` vazio; `list_projects` → 403 no escopo `white-96ac` | Release |
| Disrupty | documentação oficial acessível em `disruptybr.app`; sem produto/ID/webhook confirmados | Payment |
| Meta Pixel | código pronto; sem ID | Tracking |
| ManyChat | nenhum fluxo verificado | Tracking / Victor |

## Infraestrutura alvo (ordem de execução, só com autorização)
**Supabase:**
1. Projeto ALPHA em `sa-east-1`.
2. Aplicar `schema.sql` e checar os Advisors.
3. Auth: desligar o cadastro público (obrigatório, ver R09) e manter o convite pelo servidor.
4. Site URL e Redirect URLs (`/definir-senha` em cada domínio usado).
5. SMTP próprio, com templates de convite e de recuperação, e limite de envio adequado.

**Vercel:**
1. Acesso ao time.
2. Branch de produção.
3. Região `gru1`.
4. Variáveis por ambiente conforme a matriz.
5. Domínio.
6. Redeploy.
7. Webhook da Disrupty apontando para o domínio de produção.
8. Teste ponta a ponta.

**Rollback:** Instant Rollback da Vercel. Não desfaz banco nem variáveis; o schema é aditivo.
