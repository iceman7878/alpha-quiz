# ALPHA LAUNCH — AGENT REPORTS

Fase 0 (17/11/2026). Seis subagentes reais (ferramenta Agent), em paralelo, **todos só leitura no repositório**. A consulta entre agentes passa pelo Orchestrator: um agente não fala direto com outro. CTO, QA e Orchestrator foram exercidos pela sessão principal. Rascunhos e provas de cada agente ficaram no scratchpad do container (efêmero); o essencial está aqui.

| Agente | Missão | Status | Entrega | Revisão cruzada |
|---|---|---|---|---|
| 02 Payment/Disrupty | contrato oficial × código | ENTREGUE | `DISRUPTY-INTEGRATION-REPORT.md` | Orchestrator conferiu as fontes baixadas (status `PAGO`/`ESTORNADO`, 3 reenvios); converge com Security M1 e Backend item 7 |
| 03 Backend/DB | auditoria R4 | ENTREGUE | achados B-ALTO-1/2 abaixo; 67/67, typecheck ok; RLS testada em Postgres local | Security confirma "nenhum caminho libera sem pago"; Payment agrava B-ALTO-1 (3 reenvios, 5 s) |
| 04 Security | revisão independente | ENTREGUE | 0 crítico; A1, A2 altos; 10 provas próprias | A2 (Pixel) **confirmado de forma independente** pelo Tracking |
| 06+10 Frontend/Product | jornada + checklist comercial | ENTREGUE | bump sem entrega; pós-compra sem orientação; sem política de privacidade | Orchestrator rebaixou "checkout sem URL" de bug de código para bloqueio de configuração |
| 09 Tracking | mapa de eventos | ENTREGUE | tabela de eventos; tokens de sessão vão para a Meta; sem Purchase | Orchestrator decidiu: Purchase pela Disrupty (doc oficial), não CAPI próprio |
| 05+08 Infra/Release | matriz de ambiente + estado externo | ENTREGUE | `ENVIRONMENT-MATRIX.md` | estado externo conferido pelas respostas exatas do conector |
| 01/07/00 CTO, QA, Orchestrator | arquitetura, testes, consolidação | sessão principal | `TEST-RESULTS.md`, decisões D10–D14 | — |

## Achados consolidados (deduplicados; cada um com a origem)
| ID | Grav. | Achado | Evidência | Origem | Tipo |
|---|---|---|---|---|---|
| F01 | **CRÍTICO** | Status oficial é `PAGO`/`ESTORNADO`; o código só aceita `paid`/`refunded`/`chargedback` → nenhuma venda real libera acesso | doc S2/S3 + `normalize()` sobre o exemplo oficial | Payment (conferido) | código |
| F02 | **CRÍTICO** | Order bump (Content Vault) não tem entrega em lugar nenhum | busca em `src/` e schema; webhook ignora o bump | Product | negócio |
| F03 | ALTO | Tokens de sessão do convite/recuperação vão para a Meta no `PageView` de `/definir-senha` | reproduzido com `fbevents.js` real (`dl` com `#access_token`) | Tracking + Security | código |
| F04 | ALTO | Cadastro público do Supabase ligado = conta criada antes da compra recebe o acesso do comprador | raciocínio de código (`checkout-webhook.ts`, ramo "already registered") | Security | configuração |
| F05 | ALTO | Marca presa no webhook (timeout/`delete` falho) → 409 em todo reenvio → comprador sem acesso após 3 reenvios | `checkout-webhook.ts` claim/fail; doc: 3 reenvios, 5 s | Backend + Payment | código |
| F06 | ALTO | Falha ao ler o progresso volta `{}` e o autosave sobrescreve as respostas do aluno | `store.ts` (`loadProgress`) + `build/dia/[n]/page.tsx` | Backend | código |
| F07 | ALTO | Primeiro acesso cai em "Welcome back… entre" pedindo senha que o comprador não tem; FAQ sem pós-compra e sem canal de suporte | jornada em 390/1440 | Product | UX/copy |
| F08 | ALTO | Sem política de privacidade, termos ou identificação da empresa | busca em `src/` | Product | negócio |
| F09 | MÉDIO | Erro de rede/banco aparece como "Não encontramos uma compra ativa" | `area.tsx` | Backend + Frontend | código |
| F10 | MÉDIO | Produto aceito de qualquer chave `*id`/`*_code` do payload (incl. `tracking`/`metadata`) | prova P1 do Security; exemplo S3 | Security + Payment | código (corrigir com payload real) |
| F11 | MÉDIO | Pixel carrega sem consentimento | `layout.tsx` | Tracking | negócio/LGPD |
| F12 | MÉDIO | `/api/lead` sem limite de requisições | `api/lead/route.ts` | Security + Backend | código/infra |
| F13 | MÉDIO | Quem volta do checkout perde a rota; formulário de lead abaixo da dobra no mobile; link do ManyChat abre a landing, não a pergunta 1 | jornada | Product | conversão |
| F14 | MÉDIO | README/.env.example dizem que a assinatura é obrigatória (o código não exige) | comparação código × docs | Infra | docs |
| F15 | BAIXO | `score`/`level` sem CHECK; JSON sem limite; `flatten` recursivo estoura com JSON muito aninhado (após o token) | Postgres local; prova P3 | Backend + Security | código |

## Divergências registradas
- **Purchase:** Tracking propôs CAPI no webhook; Payment mostrou que a Disrupty já dispara Purchase pelo Pixel configurado nela. **Decisão D11:** usar o da Disrupty; o site nunca dispara Purchase.
- **Checkout sem URL:** Frontend classificou CRÍTICO de código e sugeriu falhar o build. **Decisão D12:** é bloqueio de configuração; falhar o build quebraria preview/dev.
- **F04 (cadastro aberto):** Security sugeriu também trava no código. **Decisão D13:** a defesa é desligar o cadastro público (obrigatório na fase 3, testado na fase 6); a trava no código bloquearia um comprador legítimo cuja primeira entrega falhou no meio.
- **"Estorno sem compra registrada não bloqueia ninguém":** Security concorda com a decisão D03 e pede alerta + conciliação manual até um estorno real validar.
