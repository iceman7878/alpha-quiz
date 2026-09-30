# alpha-quiz

Funil de quiz low ticket da ALPHA: quiz → resultado → Mapa de Distribuição (R$ 27).

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

Modelo em [.env.example](.env.example). Fallback do checkout em `src/config.ts`.

## Onde mexer

- Perguntas, pesos e perfis: `src/lib/quiz.ts`
- Telas: `src/components/Quiz.tsx` · estilo: `src/app/globals.css`
- UTM + Pixel: `src/lib/tracking.ts`

## Rastreamento

- UTMs (`utm_*` + `fbclid`) são capturadas na chegada (first-touch, localStorage) e repassadas ao checkout.
- O checkout recebe também `perfil`, `r` (código das 7 respostas), `src=quiz` e `sck=<perfil>-<r>` — `src`/`sck` são repassados pelas plataformas mais comuns ao webhook, para o app montar o diagnóstico.
- Eventos do Pixel: `PageView`, `QuizInicio`, `QuizConcluido`, `QuizResultado` (custom), `ViewContent`, `InitiateCheckout`.
- `/?r=1302213` abre direto o resultado daquelas respostas (útil no lembrete do ManyChat).

Link do quiz para o ManyChat:
`https://<dominio>/?utm_source=instagram&utm_medium=dm&utm_campaign=mapa&utm_content=reel01`
