# Handoff — ALPHA LAUNCH (estado em 29/10/2026)

Branch de trabalho: `main-2a0eoo`. Último commit da rodada "FINAL POLISH & LAUNCH READINESS": `4db502c`.
Regras do projeto: `CLAUDE.md`. Este arquivo só registra onde parou.

## Feito nesta rodada
- `0b87c5e` Continuidade dos dias: campos com `from` (DAY 03 quem/problema ← DAY 02; DAY 04 resultado e DAY 05 promessa ← DAY 03; DAY 06 CTA ← DAY 05), linha "Você vem do DAY 0X", concluir parcial explicado. Sem schema.
- `2047379` DAY 03 teste de clareza sem IA (passo + `clarityCheck` em `src/lib/build.ts`), DAY 06 "Hoje, na prática", DAY 07 lançar/validar/vender; Build Score em Construção (4) × Mercado (3); First Market Test com "x/8 partes" e "Evidência de mercado" (só do Build Score, via `score_answers`); mentoria sem URL não promete aviso por WhatsApp.
- `09d3c5e` FAQ com as 7 perguntas do brief (componente compartilhado: `/`, resultado e `/v2`); seção 07 da /v2 apresenta o FMT como documento de uso.
- `4db502c` /v2 chama `captureUtm()`; Pixel `Lead` só com `/api/lead` ok.

## Reconstrução plano B → R4 (17/11/2026, NÃO commitado)
O container foi recriado em 31/10 e o pacote r3 se perdeu. Esta versão é uma **reconstrução** a partir do registro da sessão, não o r3 original:
- literal (conteúdo e edições registrados): `checkout-webhook.ts`, `checkout.ts`, `content-access.ts`, rota `/api/build/content`, `store.ts`, `schema.sql`, `tests/content-access.test.ts`, README, `.env.example`, este HANDOFF; em `tests/checkout-webhook.test.ts`, as linhas 1–140, 215–234 e 330–579 do original e todas as edições da 3ª rodada;
- reescrito (o original não ficou registrado): 18 testes de `tests/checkout-webhook.test.ts` (marcados `[PLANO B]`), `src/lib/lead.ts`, `src/app/api/lead/route.ts`, `src/app/api/checkout/route.ts`, `src/config.ts` (prefill desligado) e as 3 linhas do `CLAUDE.md`;
- validação 17/11: 67/67 testes; mutação 25/25 pegas (inclui a lógica antiga do modo demo, que derruba 3 testes); typecheck e build; HTTP com `NEXT_PUBLIC_DEMO=1` sem Supabase → `/api/build/content` 503; Postgres 16 local com stubs: schema antigo → novo ganha `user_id`, novo aplica 2x, 9 checagens de permissão passam;
- refinamento visual da `/v2` (31/10): `OfferV2.tsx` + `v2.css`, preservado byte a byte;
- pacote: `alpha-launch-integrado-r4.zip` (os caminhos de pacotes r2/r3 citados abaixo não existem mais).

## Checkout Disrupty (29/10/2026, NÃO commitado)
- `src/lib/checkout.ts`: status exatos da Disrupty (`paid` libera; `refunded`/`chargedback` bloqueiam; `authorized`, `processing`, `waiting_payment`, `refused` ignorados). Corrige `chargedback`, que a regex antiga não pegava.
- `src/lib/checkout-webhook.ts` (novo): regras do webhook fora da rota, testáveis. Token na URL obrigatório; HMAC só se configurado; produto fora de `CHECKOUT_PRODUCT_IDS` ignorado; `paid` atrasado depois de reembolso não reativa; logs só com nomes de campo, sem dado pessoal.
- `src/lib/lead.ts` (novo) + `/api/lead`: o insert mandava `perfil`, coluna que não existe (a tabela tem `rota`) — todo lead falharia no Supabase.
- `src/config.ts`: prefill desligado até confirmar os nomes dos parâmetros na doc da Disrupty.
- `tests/checkout-webhook.test.ts` (61) + `tests/content-access.test.ts` (6): 67 testes com Supabase falso (`npx tsx --test tests/*.test.ts`).
- Auditoria 29/10 (corrigido, com teste que falha no código anterior):
  - configuração pela metade (só segredo ou só header da assinatura) ou token < 32 caracteres → 503 em vez de seguir sem verificar; segredo comparado por hash (tempo constante);
  - estorno de uma transação não bloqueia quem tem outra compra paga e não estornada (`kept`);
  - reenvio que encontra a marca sem o efeito pronto (outra entrega processando ou falhou) → 409, nunca 200 sem acesso;
  - erro de banco ao checar estorno → 500, nunca libera;
  - e-mail/telefone de produtor, afiliado, vendedor etc. ignorados; dois e-mails possíveis → 422;
  - dois status conhecidos diferentes no mesmo payload → 422 (não decide pela ordem do JSON).
- Segunda revisão 29/10:
  - corrigido: o id da transação saía da ordem das chaves do JSON. Se o estorno viesse com as chaves em outra ordem, o id mudava, o estorno caía em `kept` e o acesso continuava depois do reembolso. Agora o id sai por prioridade de nome (`transaction` > `order_id` > `sale_id` > `payment_id` > `id`); dois valores no mesmo nível → 422;
  - mutação (19 alterações de regra numa cópia isolada): 18 derrubam ao menos um teste; 1 é equivalente (status ambíguo já sai com 422 antes de ser usado). A que escapava (filtro de vendedor com e-mail sem prefixo) ganhou teste;
  - sem falha encontrada: conteúdo pago só no chunk do servidor de `/api/build/content` (o texto do MEI nos chunks do cliente é o exemplo público de `quiz.ts`); chave de serviço fora do cliente; `/api/build/content` exige sessão + `access_status = active`; `/api/lead` grava só os campos do lead.
- Terceira rodada 29/10 (os 2 riscos do relatório; reproduzidos antes de corrigir):
  - estorno ↔ compra: o bloqueio usava o e-mail do evento de estorno. Reproduzido: estorno com outro e-mail deixava o acesso ativo; conta com duas compras (e-mail de login trocado) perdia o acesso válido; estorno sem compra registrada bloqueava conta liberada por outro meio. Agora o `paid` grava a conta liberada em `checkout_events.user_id` antes de ativar; o estorno acha a conta pela transação (o e-mail do evento não decide nada e pode faltar); outra compra paga e não estornada da mesma conta mantém o acesso; estorno sem compra registrada não bloqueia ninguém (loga "estorno sem compra registrada" e barra o `paid` atrasado). Ordem e corrida: o estorno grava a marca antes de consultar a compra e o `paid` confere a marca de novo no fim; reenvio do estorno refaz o efeito; em erro a marca do estorno fica (o `paid` atrasado continua barrado e aplica o bloqueio pendente);
  - modo demo: reproduzido em build de produção com `NEXT_PUBLIC_DEMO=1` e sem Supabase → `/api/build/content` HTTP 200 com o conteúdo pago, sem login. Agora a regra fica em `src/lib/content-access.ts`: demo só com `NODE_ENV=development` (constante no build; `next build` grava "production") e sem nenhuma credencial do Supabase; `NEXT_PUBLIC_DEMO` não tem mais efeito. Mesmo build → 503; `NODE_ENV=development next start` sobre ele → 503. `npm run dev` sem Supabase segue com a demo (Playwright: entra, DAY 01 carrega, 0 erro de console). Mudança de comportamento: não existe mais demo em build de produção (era a própria exposição);
  - schema: `checkout_events.user_id uuid` (+ `add column if not exists` para quem já rodou). Postgres 16 local com stubs: schema antigo → novo ganha a coluna; novo aplica 2x; checagens anteriores + 6 novas (grava/filtra `user_id`, estorno sem e-mail aceito, anon e membro não leem nem alteram) passam;
  - mutação (34 alterações de regra em cópia isolada): 33 derrubam ao menos um teste; 1 equivalente (status ambíguo). A que escapava (estorno consultando a compra antes de gravar a marca) ganhou teste.
- Riscos que dependem de configuração ou do contrato (sem correção em código):
  - hipótese não confirmada: o estorno traz o MESMO id de transação do `paid`. Se vier outro id, o estorno não bloqueia ninguém (fica no log); conferir no 1º estorno de teste;
  - `CHECKOUT_PRODUCT_IDS` só com o produto principal, nunca o id do order bump;
  - cadastro público do Supabase Auth desligado (conta só por convite);
  - chargeback revertido que reenvie `paid` na mesma transação continua bloqueado (reativar à mão);
  - corrida rara: estorno ao mesmo tempo que uma recompra da mesma conta que falha no meio pode deixar o acesso ativo (exige as duas coisas no mesmo instante);
  - `/api/lead` sem limite de requisições (impacto baixo: só personaliza rota).
- Schema validado num Postgres 16 local com stubs do Supabase (não é o Supabase real): aplica e reaplica; RLS/grants seguram (anon não lê nada; membro não altera `access_status`, não cria membro, não chama `user_id_by_email`; bloqueado não grava); `leadRow` grava; formato antigo com `perfil` falha.
- Rota real em `next start` sem Supabase: 503 sem config; 401 token errado/ausente; 400 JSON; pendente/recusado/outro produto 200 ignorado; `paid` 500 (sem banco); assinatura pela metade e token curto 503.

### Checkpoint (fora do repositório, só neste container)
`/tmp/claude-0/-home-user-alpha-quiz/07fdb5d6-47e9-5ff5-abc0-eb0739899aa6/scratchpad/checkpoint-2026-10-29/` — patch + tar dos novos + patches dos 2 stashes + `MANIFEST.txt`/`RESTORE.md`. Estado ANTES da auditoria de 29/10. Some com o container: o único backup durável é commit + push (não autorizado ainda).
Pacote de recuperação do estado atual (67 testes): `/tmp/claude-0/-home-user-alpha-quiz/07fdb5d6-47e9-5ff5-abc0-eb0739899aa6/scratchpad/recuperacao/alpha-launch-recuperacao-2026-10-29-r3.zip` (patch, arquivos novos, SHA256SUMS, LEIA-ME com restaurar/validar, RESULTADOS). Sem `.env`, credenciais nem `node_modules`. O r2 (50 testes, antes desta rodada) continua ao lado.

### Confirmar na doc oficial da Disrupty (`ajuda.disrupty.com.br` bloqueado pela rede deste ambiente)
1. Formato e nomes dos campos do webhook (e-mail do comprador, transação, produto, status).
2. Autenticação: só URL ou também header/assinatura (algoritmo, header, formato).
3. Identificador do produto (id, código ou hash) e da transação; se é o mesmo id no `paid` e no estorno.
4. Estados definitivos: confirmar `paid`, `refunded`, `chargedback` (e se `authorized` vira `paid` depois).
5. Parâmetros oficiais do checkout pré-preenchido (nome, e-mail, telefone).
6. Se `sck`/UTM do link do checkout voltam no webhook.

### Configurar na Disrupty / Vercel / Supabase (com aprovação)
1. Supabase: não existe projeto da ALPHA (só `anunzy` e `anunzy-dev`, de outro produto — não mexer). Criar, rodar `supabase/schema.sql`, SMTP próprio, redirect `https://<domínio>/definir-senha`, desligar cadastro público (contas só por convite; conferir que o convite continua funcionando).
2. Vercel: projeto `alpha-quiz` existe; o conector não tem acesso ao time dele (403), então envs e deploys não foram conferidos. Variáveis (nomes): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CHECKOUT_URL`, `CHECKOUT_WEBHOOK_SECRET` (`openssl rand -hex 32`), `CHECKOUT_PRODUCT_IDS`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_MENTORSHIP_URL`; opcionais `LEAD_WEBHOOK_URL`, `CHECKOUT_SIGNATURE_*`. `NEXT_PUBLIC_DEMO` não é mais usada.
3. Disrupty: id do produto → `CHECKOUT_PRODUCT_IDS`; link → `NEXT_PUBLIC_CHECKOUT_URL`; entrega "Link Externo" → `https://<domínio>/entrar`; webhook `https://<domínio>/api/checkout?token=<CHECKOUT_WEBHOOK_SECRET>` (o token aparece nos logs de requisição da Vercel e no painel: trocar se vazar); order bump; `Purchase` do Pixel.
4. Primeiro evento de teste: ler os logs `[checkout]` na Vercel; "ignorado (produto)", "status ambíguo" ou 422 listam os nomes de campo para ajustar `normalize`. Depois um estorno de teste: tem que responder `blocked` (não "sem compra") e `/build` deixar de abrir. Depois, compra real autorizada ponta a ponta.

## Validado (só no container, modo demo)
29/10: 50/50 testes, typecheck e build ok depois da segunda revisão; 67/67, typecheck e build ok depois da terceira.
typecheck + build; Playwright 390/820/1440 sem overflow e sem erro de console (exceto 503 esperado do `/api/lead` sem banco); herança de campos, clareza, Score/FMT, funil /v2 → quiz → resultado com UTM no checkout, `Lead` condicional.

## Pendente (não validado)
- BUILD CORE e área de membros em celular real.
- Compra → webhook → convite → definir senha → login com Supabase e plataforma reais.

## Depende do Victor (não fazer sem aprovação)
1. Disrupty: `NEXT_PUBLIC_CHECKOUT_URL`, `CHECKOUT_WEBHOOK_SECRET`, `CHECKOUT_PRODUCT_IDS`, assinatura (se houver), nomes do prefill, order bump.
2. Supabase prod: envs, `supabase/schema.sql` (inclui `checkout_events` com `user_id`), redirect `/definir-senha`, SMTP próprio, `NEXT_PUBLIC_SITE_URL`.
3. `NEXT_PUBLIC_META_PIXEL_ID` (Purchase entra com o checkout real).
4. `NEXT_PUBLIC_MENTORSHIP_URL`.
5. ManyChat, deploy de produção, troca da `/`.

## QA local
```
npx tsc --noEmit -p .
npx tsx --test tests/*.test.ts
npm run dev   # sem .env: modo demonstração local (build de produção nunca abre a demo)
```

Próximo passo: autorizar commit + push deste estado (hoje só existe no container) e, em paralelo, colar aqui a doc de webhooks da Disrupty (ou liberar `ajuda.disrupty.com.br` no Network access do ambiente) com o id do produto criado.
