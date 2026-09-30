# alpha-quiz

Funil low ticket da ALPHA: comenta BUILD → quiz (3 perguntas) → captura → rota personalizada → ALPHA LAUNCH (R$ 67,97).

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
| `LEAD_WEBHOOK_URL` | Para onde vai o lead do quiz (Make, Zapier, ManyChat, planilha…). Vazio = só registra no log. |

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
