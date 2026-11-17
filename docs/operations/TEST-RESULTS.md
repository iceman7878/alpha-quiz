# ALPHA LAUNCH — TEST RESULTS & PLAN

Só entra aqui resultado executado, com data e comando. Plano = ainda não executado.

## Executado (local, sem serviços reais)
| Data | O quê | Comando / método | Resultado |
|---|---|---|---|
| 17/11 | Suíte unitária (webhook + acesso ao conteúdo) | `npx tsx --test tests/*.test.ts` | 67/67 (18 testes do webhook reescritos no plano B) |
| 17/11 | Mutação de regras (25) | `alpha-launch-integrado-r4.zip` → `validacao/mutate-r4.py` | 25/25 pegas |
| 17/11 | Typecheck / build | `npm run typecheck`, `npm run build` | ok |
| 17/11 | Rotas por HTTP (`next start`, produção, sem Supabase) | curl | conteúdo pago 503 mesmo com `NEXT_PUBLIC_DEMO=1`; checkout 401/400/200 ignorado/500/503 conforme o caso; lead 422/503 |
| 17/11 | Schema (Postgres 16 local + stubs do Supabase) | `validacao/stubs.sql` + `checks.sql` | migra do antigo, aplica 2×, 9/9 permissões |
| 17/11 | QA visual `/v2` | Playwright headless 1440/820/390/390-reduced | sem overflow, 0 erro de console, CTAs ok |
| 17/11 | Restauração do R4 em clone limpo | `git apply` + `sha256sum -c` | 18/18 hashes, 67/67, typecheck ok |

Nada acima prova integração real com Disrupty, Supabase ou Vercel.

## Plano de integração (executar quando a infraestrutura existir)
Ambiente: preview da Vercel + Supabase da ALPHA + checkout de teste da Disrupty (se houver sandbox; senão, compra real só com autorização).

| # | Cenário | Esperado | Evidência exigida |
|---|---|---|---|
| I01 | Webhook sem token / token errado | 401 | resposta + log da Vercel |
| I02 | Evento de teste `paid` do produto | 200 `invited`; linha em `members` ativa; `checkout_events` com `user_id`; e-mail de convite chega | resposta, SELECT, e-mail recebido |
| I03 | Mesmo `paid` reenviado | 200 `duplicate`; 1 convite só | contagem de convites |
| I04 | `paid` de outro produto (ex.: só o bump) | 200 ignorado; sem acesso | resposta + SELECT |
| I05 | `processing`/`waiting_payment`/`refused` | 200 ignorado; sem escrita | SELECT |
| I06 | Estorno do `paid` de I02 | 200 `blocked` (**não** "sem compra" → valida H1) | resposta + `access_status` |
| I07 | Chargeback | 200 `blocked` | idem |
| I08 | Convite → `/definir-senha` → login → `/build` | conteúdo carrega; progresso salva e volta | captura + SELECT em `progress` |
| I09 | Membro bloqueado tenta `/build` | sem conteúdo (403) | resposta |
| I10 | Esqueci minha senha | e-mail chega; redefinição funciona | e-mail + login |
| I11 | Lead do quiz | linha em `leads` com `rota` | SELECT |
| I12 | Supabase fora do ar durante `paid` | 500; Disrupty reenvia; sem acesso parcial | log + retry |
| I13 | Pixel: Lead, InitiateCheckout, Purchase | 1 disparo cada, Purchase só após pagamento | Events Manager / Test Events |
