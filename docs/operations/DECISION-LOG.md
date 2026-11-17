# ALPHA LAUNCH — DECISION LOG

Formato: data · decisão · motivo · alternativas · responsável · impacto · status.

| # | Data | Decisão | Motivo | Alternativas descartadas | Responsável | Impacto | Status |
|---|---|---|---|---|---|---|---|
| D01 | 30/09 | Oferta: 7-Day Build R$ 67,97 + bump Content Vault R$ 17,97, sem upsell | definido pelo Victor | — | Victor | produto | VIGENTE |
| D02 | 29/10 | Checkout na Disrupty; webhook fechado (503) sem token ≥ 32 + `CHECKOUT_PRODUCT_IDS` | falhar fechado até haver configuração completa | webhook aberto com config parcial | Victor / CTO | pagamento | VIGENTE |
| D03 | 29/10 | Estorno bloqueia a conta ligada à transação (`checkout_events.user_id`), nunca pelo e-mail do evento; estorno sem compra registrada não bloqueia ninguém | evitar bloquear terceiros e manter bloqueio mesmo com e-mail diferente | bloquear pelo e-mail do estorno | CTO / Security | acesso | VIGENTE (depende da hipótese H1 da Disrupty) |
| D04 | 29/10 | Modo demo só em `next dev` sem Supabase; nenhuma variável liga em produção | `NEXT_PUBLIC_DEMO` expunha o conteúdo pago | demo por variável pública | CTO / Security | conteúdo pago | VIGENTE |
| D05 | 29/10 | Prefill do checkout desligado até a Disrupty documentar os parâmetros | nome errado não preenche e põe dado pessoal na URL | chutar `name/email/phone` | Payment | conversão (leve) | VIGENTE |
| D06 | 17/11 | Plano B: reconstrução do backend r3 a partir do registro da sessão; R4 commitado em `54662ad` | ZIP r3 perdido com o container | esperar o r3 / reescrever do zero | Victor | todo o backend | CONCLUÍDO |
| D07 | 17/11 | Operação multiagente: 6 agentes de auditoria só leitura na fase 0; CTO, QA e Orchestrator consolidam | escopos sem sobreposição evitam opiniões desconectadas e edição concorrente | 10 agentes paralelos | Orchestrator | processo | VIGENTE |
| D08 | 17/11 | Documentação operacional em `docs/operations/`; arquivos novos só quando houver conteúdo real | evitar documentação vazia/duplicada | criar os 10 arquivos de uma vez | Orchestrator | processo | VIGENTE |
| D09 | 17/11 | Branch de trabalho `ops/bootstrap`, sem tocar `main-2a0eoo` até integrar com aprovação | regra do Victor: não reescrever `54662ad`, sem force push | trabalhar direto em `main-2a0eoo` | Orchestrator | git | VIGENTE |
| D10 | 17/11 | Contrato da Disrupty: vale a doc atual em `disruptybr.app` (status `PAGO`/`ESTORNADO`, 3 reenvios, 5 s); os snippets antigos (`paid`, 5 reenvios) ficam como histórico | fonte oficial atual, baixada e conferida | manter os valores antigos como contrato | CTO / Payment | corrigir F01 | VIGENTE |
| D11 | 17/11 | Purchase do Pixel virá da própria Disrupty (Pixel configurado nela, opção CAPI); o site nunca dispara Purchase | doc oficial S1; zero código; evita contagem dupla | CAPI próprio no webhook | CTO / Tracking | tracking | PROPOSTA (Victor configura) |
| D12 | 17/11 | Checkout sem URL é bloqueio de configuração, não de código; não falhar o build | falhar o build quebraria preview/dev | build falha sem `NEXT_PUBLIC_CHECKOUT_URL` | CTO | release | VIGENTE |
| D13 | 17/11 | Cadastro público do Supabase desligado é obrigatório (fase 3) e testado (fase 6); sem trava extra no código por ora | a trava no código bloquearia comprador legítimo após falha parcial | exigir `members` existente no ramo "already registered" | CTO / Security | acesso | VIGENTE |
| D14 | 17/11 | Fase 4 usa o link de teste oficial da Disrupty (sem cobrança, valor 0) antes de qualquer compra real | doc oficial S1/S2 | compra real de R$ 67,97 | Payment | custo zero | PROPOSTA |
