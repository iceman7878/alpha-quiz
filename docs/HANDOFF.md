# Handoff — ALPHA LAUNCH (estado em 15/10/2026)

Branch de trabalho: `main-2a0eoo`. Último commit da rodada "FINAL POLISH & LAUNCH READINESS": `4db502c`.
Regras do projeto: `CLAUDE.md`. Este arquivo só registra onde parou.

## Feito nesta rodada
- `0b87c5e` Continuidade dos dias: campos com `from` (DAY 03 quem/problema ← DAY 02; DAY 04 resultado e DAY 05 promessa ← DAY 03; DAY 06 CTA ← DAY 05), linha "Você vem do DAY 0X", concluir parcial explicado. Sem schema.
- `2047379` DAY 03 teste de clareza sem IA (passo + `clarityCheck` em `src/lib/build.ts`), DAY 06 "Hoje, na prática", DAY 07 lançar/validar/vender; Build Score em Construção (4) × Mercado (3); First Market Test com "x/8 partes" e "Evidência de mercado" (só do Build Score, via `score_answers`); mentoria sem URL não promete aviso por WhatsApp.
- `09d3c5e` FAQ com as 7 perguntas do brief (componente compartilhado: `/`, resultado e `/v2`); seção 07 da /v2 apresenta o FMT como documento de uso.
- `4db502c` /v2 chama `captureUtm()`; Pixel `Lead` só com `/api/lead` ok.

## Validado (só no container, modo demo)
typecheck + build; Playwright 390/820/1440 sem overflow e sem erro de console (exceto 503 esperado do `/api/lead` sem banco); herança de campos, clareza, Score/FMT, funil /v2 → quiz → resultado com UTM no checkout, `Lead` condicional.

## Pendente (não validado)
- BUILD CORE e área de membros em celular real.
- Compra → webhook → convite → definir senha → login com Supabase e plataforma reais.

## Depende do Victor (não fazer sem aprovação)
1. Plataforma de checkout + `NEXT_PUBLIC_CHECKOUT_URL`, segredos/assinatura do webhook, `CHECKOUT_PRODUCT_IDS`, nomes do prefill.
2. Supabase prod: envs, `supabase/schema.sql` (inclui `checkout_events`), redirect `/definir-senha`, SMTP próprio, `NEXT_PUBLIC_SITE_URL`.
3. `NEXT_PUBLIC_META_PIXEL_ID` (Purchase entra com o checkout real).
4. `NEXT_PUBLIC_MENTORSHIP_URL`.
5. ManyChat, deploy de produção, troca da `/`.

## QA local
```
npx tsc --noEmit -p .
NEXT_PUBLIC_DEMO=1 npm run build && npx next start -p 3200   # demo só local; nunca em produção
```

Próximo passo: definir a plataforma de checkout.
