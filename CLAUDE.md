# ALPHA Quiz — funil low ticket

Funil de quiz low ticket da ALPHA Enterprises, rodado no Instagram do Victor com automação via ManyChat.

## Oferta
- Produto: **Mapa de Distribuição** — R$ 27
- Order bump sugerido: R$ 17 (ex.: "50 roteiros de conteúdo para o seu modelo")
- Plataforma de checkout: **ainda não definida** — o link de checkout deve ficar em UMA variável de config fácil de trocar
- Tom: competência, sem promessa de renda, sem escassez artificial, sem linguagem de enriquecimento fácil

## Fluxo
1. Reel/story → pessoa comenta `MAPA` → ManyChat manda DM com link do quiz (com UTM + tag)
2. Quiz: tela de abertura → 7 perguntas (tempo disponível, habilidade, capital, aparecer ou não, meta, experiência, maior trava) → tela "analisando…" → resultado
3. 4 perfis de resultado (ex.: "Distribuidor Silencioso"), cada um mapeado para um modelo: afiliação, coprodução, produto próprio, serviço
4. Resultado com diagnóstico curto + oferta → botão para checkout
5. Pós-compra: webhook do checkout libera acesso ao app e envia link de login por e-mail

## Entregáveis
1. **Quiz** (mobile-first), deploy na Vercel, Meta Pixel + captura de UTM
2. **App web "Mapa de Distribuição"** (o produto): área logada com diagnóstico personalizado pelas respostas do quiz, plano de 14 dias como checklist interativo com progresso, kit de templates (planilhas, scripts de DM, modelos de conteúdo) com botão de copiar. Preparado para receber vídeos depois.
3. **Roteiro ManyChat**: mensagens, palavras-chave, tags, lembrete para quem não concluiu o quiz (o Victor monta na conta dele)
4. **Copy de divulgação**: 5 roteiros de reels "comenta MAPA", bio, story fixado

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
