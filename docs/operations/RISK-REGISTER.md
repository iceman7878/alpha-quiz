# ALPHA LAUNCH — RISK REGISTER

Escala: probabilidade e impacto Baixo/Médio/Alto; gravidade = combinação. Riscos novos dos agentes entram com o ID do relatório de origem.

| ID | Risco | Prob. | Impacto | Gravidade | Responsável | Mitigação | Status |
|---|---|---|---|---|---|---|---|
| R01 | **H1**: o evento de estorno da Disrupty pode trazer um id de transação diferente do `paid`; então o estorno não bloqueia ninguém e o acesso fica após reembolso | Média | Alto | ALTA | Payment | confirmar na doc oficial ou com estorno de teste; o código já loga "estorno sem compra registrada" | ABERTO |
| R02 | Contrato da Disrupty diferente do assumido no código | **Ocorreu** | Alto | **CRÍTICA** | Payment / Backend | doc oficial encontrada: status `PAGO`/`ESTORNADO` (F01); campos oficiais em `DISRUPTY-INTEGRATION-REPORT.md`; validar com evento de teste | MITIGADO no código (F01, 17/11); falta evento de teste |
| R03 | Assinatura do webhook não confirmada: hoje a autenticação é só o token na URL (vaza em logs de requisição) | Média | Médio | MÉDIA | Security | confirmar HMAC na doc; trocar token se vazar | ABERTO |
| R04 | 18 testes do webhook reescritos no plano B não são a suíte original | Certa | Baixo | BAIXA | QA | mutação 25/25 provou que cobrem as regras | ACEITO |
| R05 | Infraestrutura inexistente: sem Supabase da ALPHA, lead responde 503 e não há área de membros real | Certa | Alto | ALTA (bloqueia venda) | Infra | fase 3 com autorização | ABERTO |
| R06 | Conector sem acesso ao time da Vercel (403) | Alta | Médio | MÉDIA | Release | Victor autoriza o conector ou configura manualmente | ABERTO |
| R07 | Trabalho perdido por reinício do container (já aconteceu em 31/10) | Média | Alto | ALTA | Orchestrator | commit + push de cada etapa aprovada; status no repo | MITIGADO (R4 no GitHub) |
| R08 | Purchase do Pixel sem fonte confirmada de pagamento | Alta | Médio | MÉDIA | Tracking | D11: Purchase pelo Pixel configurado na Disrupty; site nunca dispara | MITIGAÇÃO PROPOSTA |
| R09 | Cadastro público do Supabase ligado (padrão): conta pré-criada com o e-mail do comprador recebe o acesso (F04) | Baixa | Alto | ALTA | Infra / Security | D13: desligar o cadastro; testar na fase 6 | ABERTO |
| R10 | Tokens de sessão enviados à Meta pelo PageView em `/definir-senha` (F03) | Certa (com Pixel ligado) | Alto | ALTA | Tracking / Security | Pixel removido dessas rotas (F03, verificado em build) | MITIGADO |
| R11 | Marca presa no webhook deixa comprador sem acesso; Disrupty só reenvia 3× em ~50 min e exige resposta em 5 s (F05) | Média | Alto | ALTA | Backend | marca abandonada retomada após 2 min com posse por token e liberação transacional (F05); falta medir o tempo do convite real (> 5 s gasta reenvio) e aplicar o schema novo | MITIGADO no código |
| R12 | Order bump vendido sem entrega (F02) | Certa (se o bump for ligado) | Alto | **CRÍTICA** | Product / Victor | entregar o Vault pela Disrupty ou deixar o bump desligado | ABERTO |
| R13 | Progresso do aluno sobrescrito após falha de leitura (F06) | Baixa | Alto | ALTA | Backend | `LoadError` + estado de erro na área (F06/F09) | MITIGADO |
| R14 | Sem política de privacidade/termos/identificação (F08): bloqueio de anúncios e de cadastro, risco LGPD | Alta | Médio | ALTA | Product / Victor | redigir e publicar antes do tráfego | ABERTO |
| R15 | Pós-compra sem orientação nem canal de suporte (F07) → suporte e chargeback | Alta | Médio | ALTA | Product / Frontend | orientação de primeiro acesso + FAQ pós-compra + canal | ABERTO |
| R16 | Pagamento e estorno da mesma transação no mesmo segundo: o banco não os serializa; estorno gravado entre a checagem e o commit do `finalize` deixa o acesso ativo até a checagem tardia do `paid` (ou o reenvio dele). Teste local: estado final bloqueado nos 2 ordenamentos; janela aberta só se a função cair entre o commit e a checagem tardia **e** a Disrupty não reenviar | Muito baixa (estorno chega dias depois) | Médio | BAIXA | Backend | pós-lançamento: estorno via RPC que trava a linha do `approved` | ACEITO no lançamento |
| R17 | Convite: a consulta da conta antes do envio **reduz** duplicidade, não garante "exatamente uma vez"; convite pode se perder (SMTP, spam, conta já existente sem senha). O SMTP padrão do Supabase tem limite de envio muito baixo | Média | Alto (comprador sem acesso) | ALTA | Infra / Product | SMTP próprio antes de vender; "Esqueci minha senha" em `/entrar` como recuperação; orientação pós-compra (R15); outbox só se o volume pedir | ABERTO |
