# ALPHA LAUNCH — funil low ticket

Funil de quiz low ticket da ALPHA Enterprises, rodado no Instagram do Victor com automação via ManyChat.

## Oferta (decidido em 30/09/2026)
- Produto: **ALPHA LAUNCH — 7-Day Build** — R$ 67,97, pagamento único, sem âncora ("De R$ X") e sem escassez artificial
- Promessa (controlável): em 7 dias, transformar uma direção em uma oferta digital pronta para colocar no mercado. Nunca prometer SaaS, negócio pronto ou renda
- Order bump: **ALPHA Content Vault** — R$ 17,97 (hooks, estruturas de reels, CTAs, prompts, ideias de conteúdo). Nada dos templates essenciais do core vai para o bump
- Sem upsell por enquanto — o mercado decide depois
- O produto é o 7-Day Build; o app é só o veículo de entrega. Vídeos entram depois, gravados em cima de onde os compradores travarem
- Plataforma de checkout: **ainda não definida** — link em `NEXT_PUBLIC_CHECKOUT_URL` (`src/config.ts`)
- Tom: competência, sem promessa de renda, sem escassez artificial, sem linguagem de enriquecimento fácil

## Fluxo
1. Reel/TikTok → "Comenta **BUILD**" → ManyChat manda DM ("Antes de te mostrar sua rota, preciso de 3 respostas rápidas") com link do quiz (UTM + tag)
2. Quiz: abertura → **3 perguntas** (ponto de partida, exposição, ritmo) → "montando sua rota…" → **"Seu plano personalizado está pronto."** + nome, WhatsApp (obrigatório), e-mail (opcional), aceite LGPD → rota
3. 4 rotas: AI Service Builder (serviço com IA), Expertise Builder (produto próprio), Backstage Builder (coprodução), Distribution Builder (distribuição de produtos validados)
4. Resultado = página de vendas personalizada (rota + frase montada com as respostas + DAY 01) → checkout
5. Pós-compra: webhook do checkout libera acesso ao app e envia link de login por e-mail

## 7-Day Build (cada dia gera um entregável)
DAY 01 FIND (direção) · DAY 02 PROBLEM (problema) · DAY 03 OFFER (oferta) · DAY 04 MVP (menor versão que entrega o resultado — definir, não programar) · DAY 05 POSITION (headline, promessa, mensagem, CTA) · DAY 06 DISTRIBUTE (3 conteúdos, 3 hooks, CTA, canal) · DAY 07 LAUNCH (publicar)

**BUILD SCORE** no DAY 07: 7 critérios sim/não (oferta, MVP, página/posicionamento, distribuição, conversas, primeira venda/validação, métricas) → BUILD 01 (começou), BUILD 02 (construiu = oferta + MVP), BUILD 03 (colocou no mercado = oferta + conversas reais + ≥5 critérios). É dado de CRM para segmentar, não catraca: BUILD 03 recebe CTA direto para aplicar à ALPHA Mentorship; os demais entram em sequências diferentes. Tela final "BUILD COMPLETE" → [Aplicar para a ALPHA].

## Entregáveis
1. **Quiz** (mobile-first, Next.js), deploy na Vercel (confirmar com o Victor antes), Meta Pixel + captura de UTM + captura de lead (`/api/lead` → tabela `leads`) — FEITO
2. **App web ALPHA LAUNCH** (o veículo): área logada com a rota personalizada, 7-Day Build em checklist com entregáveis e progresso, 7 módulos curtos em texto, templates essenciais com botão de copiar, Build Score, CTA de mentoria. Preparado para vídeos depois — FEITO (`/build`; Supabase mínimo: leads, members com access_status, progress; conteúdo servido só após login + acesso ativo)
3. **Roteiro ManyChat**: palavra BUILD, mensagens, tags, lembrete para quem não concluiu o quiz (o Victor monta na conta dele)
4. **Copy de divulgação**: 5 roteiros de reels "comenta BUILD", bio, story fixado

## Identidade visual — ALPHA "Campo Silencioso" (obrigatório)
```css
:root {
  --campo-top:    #08080A;
  --campo-bottom: #111114;
  --osso:         #E9E4DB;
  --osso-40:      rgba(233,228,219,.40);
  --osso-12:      rgba(233,228,219,.12);
  --contraluz:    rgba(62,68,79,.09);
}
body { background: linear-gradient(180deg, var(--campo-top), var(--campo-bottom)); color: var(--osso); }
```
- Fontes (Google Fonts): Jura Light 300 (wordmark, caixa alta, letter-spacing .42em); Geist Mono (micro-tipografia 9–10px, caixa alta, letter-spacing .45em, opacidade 40–46%; fallback ui-monospace); Inter (interface/corpo)
- Símbolo: anel fino com ponto sólido ao centro ("ORIGEM"). Wordmark e símbolo NUNCA na mesma tela
- Máx. 3 marcadores de micro-tipografia por tela (ex.: `CAMPO 01`, `01 — 07`)
- Cantos retos sempre; composição com peso diagonal, sem simetria; grão finíssimo; vinheta sutil
- Rejeitar: roxo/cores saturadas, emoji, ilustração/foto de banco, botão arredondado com sombra, fundo chapado, fonte grossa/estilo coach, ostentação
- Motion: ease-out com propriedade explícita (nunca `transition: all`), curto, nada saindo de `scale(0)`, `:active` em todo botão
- Assinatura: ALPHA — BUILD THE LIFE YOU WANT. Copy em português.

## Fase atual (01/10/2026)
Design aprovado. Daqui em diante: polish + conversão + operação do funil. Evitar redesign e mudanças grandes no ALPHA LAUNCH.

- **Duas portas / "A porta vazia"** (`TwoDoors` em `src/components/ui.tsx`): elemento especial, só em dois lugares — seção do resultado e abertura do DAY 07. Não usar em hero, quiz, outros dias ou peças novas; perde força se repetir.
- Webhook do checkout (`/api/checkout`) fica fechado (503) até ter token + assinatura do provider + `CHECKOUT_PRODUCT_IDS`; idempotente via tabela `checkout_events`. Não é produção até validar com eventos reais da plataforma escolhida. `Purchase` do Pixel entra com o checkout real.
- Narrativa da área: DAY 01 "Agora começou." → DAY 02–06 construção → DAY 07 "Hoje você entra pela porta vazia."
