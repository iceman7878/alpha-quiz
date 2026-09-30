# alpha-quiz

Funil low ticket da ALPHA: comenta BUILD → quiz (3 perguntas) → captura → rota personalizada → ALPHA LAUNCH (R$ 67,97) → área de membros do 7-Day Build.

Escopo completo em [CLAUDE.md](CLAUDE.md).

## Rodar

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de produção
```

## Configuração (Vercel → Environment Variables)

| Variável | O que é |
|---|---|
| `NEXT_PUBLIC_CHECKOUT_URL` | Link do checkout. Único lugar a trocar quando a plataforma for definida. |
| `NEXT_PUBLIC_META_PIXEL_ID` | ID do Meta Pixel. Vazio = pixel desligado. |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Projeto Supabase (Settings → API). Sem elas, `/build` roda em modo demonstração só em desenvolvimento ou com `NEXT_PUBLIC_DEMO=1` (usar apenas no ambiente Preview da Vercel). |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role — só servidor. Grava leads e cria membros. |
| `CHECKOUT_WEBHOOK_SECRET` | Token do webhook do checkout. |
| `NEXT_PUBLIC_SITE_URL` | Domínio final, usado no link do convite. |
| `NEXT_PUBLIC_MENTORSHIP_URL` | Link da aplicação para a mentoria. |
| `LEAD_WEBHOOK_URL` | (Opcional) Cópia do lead para outro destino (Make, Zapier, ManyChat…). |

Modelo em [.env.example](.env.example). Fallback do checkout em `src/config.ts`.

## Onde mexer

- Perguntas, pesos e rotas do quiz: `src/lib/quiz.ts`
- Conteúdo dos 7 dias (só servidor): `src/lib/build-content.ts`
- Captura de lead: `src/app/api/lead/route.ts`
- Telas do funil: `src/components/Quiz.tsx` (orquestra) + `src/components/funnel/*`
- Componentes da marca (Rail, Artefato, Mapa de rotas, Reveal, Copy): `src/components/ui.tsx`
- **Design tokens** (cor, tipo, espaço, motion, breakpoints): `src/styles/tokens.css` — mudar aqui muda o produto inteiro
- Estilos: `src/styles/base.css` (base + componentes), `funnel.css`, `area.css`
- UTM + Pixel: `src/lib/tracking.ts`

## Rastreamento

- UTMs (`utm_*` + `fbclid`) são capturadas na chegada (first-touch, localStorage) e repassadas ao checkout.
- O checkout recebe também `rota`, `r` (código das 3 respostas), `src=quiz`, `sck=<rota>-<r>` e o pré-preenchimento de nome/e-mail/telefone (nomes dos parâmetros em `CHECKOUT_PREFILL`) — `src`/`sck` são repassados pelas plataformas mais comuns ao webhook, para o app montar o diagnóstico.
- Eventos do Pixel: `PageView`, `QuizInicio`, `QuizConcluido`, `QuizRota` (custom), `Lead`, `ViewContent`, `InitiateCheckout`.
- `/?r=021` abre direto a rota daquelas respostas (útil no lembrete do ManyChat).

Link do quiz para o ManyChat:
`https://<dominio>/?utm_source=instagram&utm_medium=dm&utm_campaign=build&utm_content=reel01`

## Área de membros (`/build`)

Rotas: `/entrar` (login), `/definir-senha` (destino do convite e da recuperação), `/build` (home), `/build/dia/1…7`, `/build/score`.

- **Conteúdo dos 7 dias** (`src/lib/build-content.ts`) só existe no servidor. É entregue por `/api/build/content` apenas para sessão válida + `access_status = active` — não vai no JavaScript público.
- **Progresso e respostas**: tabela `progress` (uma linha por dia, respostas em JSONB, salvamento automático).
- **Build Score**: colunas `score`, `level`, `score_answers` em `members`.
- **Modo demonstração** (dados só no navegador): apenas em desenvolvimento ou com `NEXT_PUBLIC_DEMO=1`. Em produção sem Supabase, `/build` mostra "Área em configuração" e nada do produto é aberto.

### Banco (`supabase/schema.sql`)

| Tabela | Campos principais | Quem acessa |
|---|---|---|
| `leads` | nome, whatsapp, email, rota, r, utm, consentimento | só o servidor |
| `members` | id (= usuário do Auth), email, nome, route, access_status (`active`/`blocked`), score, level, created_at, updated_at | o membro lê o próprio; só altera o score |
| `progress` | id, user_id, day, completed, answers (JSONB), updated_at | o próprio membro, se `active` |

Visão `crm_build`: quem comprou → dias concluídos → nível (só pelo painel do Supabase).

## Colocar no ar

### 1. Supabase (~15 min)

1. Criar o projeto em supabase.com (região São Paulo).
2. **SQL Editor** → colar e rodar `supabase/schema.sql`.
3. **Authentication → Sign In / Providers → Email**: desligar **"Allow new users to sign up"** (só entra quem o webhook convidar).
4. **Authentication → URL Configuration**: Site URL = domínio final; em Redirect URLs, adicionar `https://<dominio>/definir-senha`.
5. **Authentication → Emails → SMTP Settings**: configurar SMTP próprio (ex.: Resend, grátis até 3.000/mês). O e-mail padrão do Supabase só envia poucos e-mails por hora — não serve para vender.
6. **Authentication → Email Templates**:
   - *Invite user* — assunto `Seu acesso ao ALPHA LAUNCH está pronto`; botão para `{{ .ConfirmationURL }}`.
   - *Reset password* — assunto `Nova senha — ALPHA LAUNCH`; botão para `{{ .ConfirmationURL }}`.
7. **Project Settings → API**: copiar Project URL, `anon` key e `service_role` key.

### 2. Vercel

1. Importar o repositório `iceman7878/alpha-quiz` (framework: Next.js; sem configuração extra).
2. **Settings → Environment Variables** (Production):

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (secreta) |
| `CHECKOUT_WEBHOOK_SECRET` | um texto aleatório longo |
| `NEXT_PUBLIC_SITE_URL` | `https://<dominio>` |
| `NEXT_PUBLIC_CHECKOUT_URL` | link do checkout |
| `NEXT_PUBLIC_META_PIXEL_ID` | ID do pixel |
| `NEXT_PUBLIC_MENTORSHIP_URL` | link da aplicação (opcional) |

   **Não** definir `NEXT_PUBLIC_DEMO` em produção.
3. Deploy. Variáveis `NEXT_PUBLIC_*` entram no build: depois de alterar alguma, fazer **Redeploy**.
4. Domínio próprio em **Settings → Domains** e repetir o domínio no passo 4 do Supabase.

### 3. Checkout

Cadastrar o webhook na plataforma: `https://<dominio>/api/checkout?token=<CHECKOUT_WEBHOOK_SECRET>`.

| Evento | Efeito |
|---|---|
| Compra aprovada | cria o usuário, envia o convite, `access_status = active` |
| Recompra de quem já tem conta | `access_status = active` (sem novo convite; entra ou recupera a senha) |
| Reembolso / chargeback / cancelamento | `access_status = blocked` — perde o acesso ao conteúdo e aos dados; nada é apagado |

A plataforma ainda não foi escolhida: o webhook reconhece os formatos mais comuns (e-mail, nome, telefone, status, `sck`). **Validar com um evento de teste** da plataforma escolhida.

### 4. Teste de ponta a ponta (depois de configurar)

1. Fazer o quiz → conferir a linha nova em `leads`.
2. Disparar um evento de compra de teste → conferir `members` (`active`) e o e-mail de convite.
3. Criar a senha → `/build` abre com a rota certa.
4. Preencher o DAY 01, fechar a aba, voltar → respostas mantidas; concluir → `progress.completed = true`.
5. Fazer o Build Score → `members.score`/`level` gravados.
6. Disparar um reembolso de teste → `/build` mostra "Acesso não encontrado".
7. Disparar a compra de novo → acesso volta, com o progresso intacto.
