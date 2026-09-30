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
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Projeto Supabase (Settings → API). Sem elas, `/build` roda em modo demonstração. |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role — só servidor. Grava leads e cria membros. |
| `CHECKOUT_WEBHOOK_SECRET` | Token do webhook do checkout. |
| `NEXT_PUBLIC_SITE_URL` | Domínio final, usado no link do convite. |
| `NEXT_PUBLIC_MENTORSHIP_URL` | Link da aplicação para a mentoria. |
| `LEAD_WEBHOOK_URL` | (Opcional) Cópia do lead para outro destino (Make, Zapier, ManyChat…). |

Modelo em [.env.example](.env.example). Fallback do checkout em `src/config.ts`.

## Onde mexer

- Perguntas, pesos, rotas e os 7 dias: `src/lib/quiz.ts`
- Captura de lead: `src/app/api/lead/route.ts`
- Telas: `src/components/Quiz.tsx` · estilo: `src/app/globals.css`
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
Conteúdo dos 7 dias (textos, campos, entregável montado, ferramentas): `src/lib/build.ts`.

### Configurar o Supabase (uma vez, ~15 min)

1. Criar o projeto em supabase.com (região São Paulo).
2. SQL Editor → colar e rodar `supabase/schema.sql` (tabelas `leads`, `members`, `progress` + visão `crm_build`).
3. Authentication → Sign In / Providers → Email: **desligar "Allow new users to sign up"** (só entra quem o webhook convidar).
4. Authentication → URL Configuration: Site URL = domínio final; adicionar `https://<dominio>/definir-senha` em Redirect URLs.
5. Authentication → Emails → SMTP: configurar um SMTP próprio (ex.: Resend). **O e-mail padrão do Supabase tem limite de poucos envios por hora** — não serve para lançamento.
6. Authentication → Email Templates → "Invite user": assunto `Seu acesso ao ALPHA LAUNCH está pronto`, corpo com o botão para `{{ .ConfirmationURL }}`.
7. Copiar URL, anon key e service role para as variáveis da Vercel.

### Webhook do checkout

Cadastrar na plataforma: `https://<dominio>/api/checkout?token=<CHECKOUT_WEBHOOK_SECRET>`.
Compra aprovada → cria/ativa o membro (rota vem do `sck` ou do lead do quiz) e envia o convite. Reembolso/chargeback → desativa.
Como a plataforma ainda não foi escolhida, o webhook procura e-mail, nome, telefone e status nos formatos mais comuns — **validar com um evento de teste** quando a plataforma for definida.

### CRM

A visão `crm_build` (Supabase → Table Editor) mostra quem comprou → dias concluídos → Build Score/nível. BUILD 03 recebe o CTA direto de aplicação; os demais são segmentados, não bloqueados.
