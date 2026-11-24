# ALPHA LAUNCH — PROJECT STATUS

> Fonte única da verdade operacional. Uma sessão nova começa por aqui, depois `DECISION-LOG.md` e `RISK-REGISTER.md`.
> Regras do produto e da marca: `CLAUDE.md`. Histórico técnico do checkout: `docs/HANDOFF.md`.

**Última atualização:** 17/11/2026 · **Fase atual:** 0 — Bootstrap e auditoria

## Atualização 24/11/2026 — operação de lançamento
- `main` @ `de95f3e` em produção (`alpha-quiz-five.vercel.app`); `fix/p0-launch` já contida em `main`.
- Disrupty: produto `11113` (R$ 67,97, único, sem bump/upsell, entrega manual), checkout `https://pay.disruptybr.app/c/OrZ?of=8kD`.
- Webhook "ALPHA LAUNCH — Vendas" salvo na Disrupty (PAGO + ESTORNADO, só produto 11113) apontando para `/api/checkout?token=…`.
- Vercel (production): `CHECKOUT_PRODUCT_IDS=11113`, `NEXT_PUBLIC_CHECKOUT_URL`, `CHECKOUT_WEBHOOK_SECRET` **novo** (o antigo foi exposto; rotacionado).
- Testes em produção com payload no formato oficial: sem token 401 · produto errado ignorado · PAGO sem externalId 422 · PAGO com externalId ativa a conta certa · duplicado · pendente ignorado · ESTORNADO bloqueia a conta da transação (mesmo com outro e-mail) · estorno duplicado · PAGO atrasado após estorno não reativa · estorno sem compra não bloqueia ninguém. Quiz → lead → resultado → /comprar ok. `/api/build/content` sem sessão = 401.
- **Pendente (único):** compra no link de teste oficial da Disrupty para confirmar que ela devolve o `externalId` no webhook. O checkout de teste exige CPF (preenchido pelo Victor).
- Linhas de teste a apagar: `checkout_events` com `txn like 'TESTE-%'`; conta `alpha.teste.webhook1124@example.com`.

## Estado do código
| Item | Valor | Evidência |
|---|---|---|
| Repositório | `iceman7878/alpha-quiz` | `git remote -v` |
| Branch estável | `main-2a0eoo` @ `54662ad` (R4) | igual a `origin/main-2a0eoo` em 17/11 |
| Branches de trabalho | `ops/bootstrap` e `fix/p0-launch` (ambas a partir de `54662ad`) | docs operacionais + correções P0; **nada commitado ainda** (aguarda autorização) |
| Testes | 67/67 (`npx tsx --test tests/*.test.ts`) | 18 testes do webhook reescritos no plano B: **não** são a suíte original do r3 |
| Typecheck / build | ok | 17/11 |
| Backup | `alpha-launch-integrado-r4.zip` (fora do repo; o Victor tem cópia) | GitHub é o backup durável desde `54662ad` |

## Fases
| # | Fase | Status | Gate para avançar |
|---|---|---|---|
| 0 | Bootstrap e auditoria | **CONCLUÍDA** (17/11) | 6 relatórios consolidados em `AGENT-REPORTS.md` |
| 1 | Contrato Disrupty | **PARCIAL**: doc oficial encontrada; falta evento de teste | `DISRUPTY-INTEGRATION-REPORT.md`; pontos HIPÓTESE dependem do evento de teste |
| 2 | Auditoria geral + correções críticas/altas | PENDENTE | 0 crítico/alto aberto sem decisão |
| 3 | Supabase da ALPHA | BLOQUEADO (autorização) | projeto criado e schema validado |
| 4 | Checkout + webhook reais | BLOQUEADO (fases 1 e 3) | paid/estorno de teste com evidência |
| 5 | Vercel | BLOQUEADO (acesso ao time) | preview funcionando com envs reais |
| 6 | Auth e área de membros reais | BLOQUEADO (fases 3 e 5) | jornada pós-compra validada |
| 7 | Tracking e ManyChat | PENDENTE | mapa de eventos sem duplicidade |
| 8 | QA end-to-end | BLOQUEADO (fases 3–7) | 18 cenários com evidência |
| 9 | Release readiness | BLOQUEADO | parecer go/no-go; decisão do Victor |

## Concluído (com evidência)
- R4 commitado e no GitHub (`54662ad`): backend do checkout + segurança + visual V2. Validação local em `docs/HANDOFF.md`.

- Fase 0: 6 auditorias paralelas consolidadas (`AGENT-REPORTS.md`): **2 críticos, 6 altos, 7 médios/baixos** (F01–F15).
- Contrato oficial da Disrupty localizado (`DISRUPTY-INTEGRATION-REPORT.md`) e matriz de ambiente (`ENVIRONMENT-MATRIX.md`).

## Em andamento
- Nada em execução. Aguardando decisões do Victor (abaixo).

## Correções de código prontas para executar (fase 2, locais, baixo risco)
1. ~~**F01** status oficial `PAGO`/`ESTORNADO`~~ **FEITO** (17/11, branch `fix/p0-launch`, sem commit): status oficiais + ambiguidade por significado; 5 testes de contrato com os campos oficiais (falham 4/5 no código antigo); 72/72, typecheck ok.
2. ~~**F03** Pixel fora de `/definir-senha`, `/entrar`, `/build*`~~ **FEITO** (17/11, mesma branch): verificado em build de produção com Pixel ligado: 0 requisições ao Facebook nessas rotas, Pixel normal em `/` e `/v2`.
3. ~~**F05** marca presa no webhook~~ **FEITO** (17/11): marca sem efeito mais velha que 2 min é retomada pelo reenvio. Revisão pré-commit achou falha de posse no v1; corrigido com token por execução + retomada por UPDATE condicional + liberação transacional `finalize_checkout_claim` (quem perdeu a posse não apaga, não libera, não finaliza); `maxDuration = 30` na rota. **Exige rodar o `supabase/schema.sql` atualizado antes do deploy.**
4. ~~**F06/F09** erro de leitura~~ **FEITO** (17/11): leituras distinguem erro de vazio (`LoadError`); `loadArea` testável; área ganhou estado "Não foi possível carregar" com tentar de novo.
5. ~~**F14** README/.env.example~~ **FEITO** (17/11).
Validação 17/11 (`fix/p0-launch`): 87/87 testes, typecheck, build; regressões de F01, F05 (inclusive posse A–D) e F06/F09 falham no código anterior; SQL do F05 validado em Postgres 16 local (23 checagens, corrida entre 2 conexões); demo local abre área e dia 1 sem erro.

## Bloqueado (dependências externas)
- Evento de teste da Disrupty (JSON + headers), `productId`/`offerId`, segredo do `X-Signature` (lista em `DISRUPTY-INTEGRATION-REPORT.md`).
- Entrega do order bump (F02) e textos legais (F08): decisão de negócio.
- Projeto Supabase da ALPHA (não existe; criar exige autorização).
- Acesso do conector ao time da Vercel (403 em outubro).
- ID do produto e link do checkout na Disrupty; `NEXT_PUBLIC_META_PIXEL_ID`; `NEXT_PUBLIC_MENTORSHIP_URL`; fluxos ManyChat.

## Decisões pendentes do Victor
Ver `DECISION-LOG.md` (status PENDENTE).

## Próxima ação
Autorizar os commits locais (docs + `fix/p0-launch`). Depois: decisões de negócio F02 (entrega do bump), F07 (primeiro acesso/FAQ pós-compra) e F08 (textos legais); e o evento de teste da Disrupty.
