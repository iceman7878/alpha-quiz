// Configuração central do funil. Tudo que muda com frequência mora aqui.

/**
 * Link do checkout do ALPHA LAUNCH na Disrupty.
 * Vem de NEXT_PUBLIC_CHECKOUT_URL (Vercel → Environment Variables). É o ÚNICO lugar onde o link existe.
 * O order bump (Content Vault, R$ 17,97) é configurado no próprio checkout da Disrupty.
 */
export const CHECKOUT_URL =
  process.env.NEXT_PUBLIC_CHECKOUT_URL || "/checkout-em-breve";

/**
 * Nomes dos parâmetros de pré-preenchimento do checkout (nome, e-mail, telefone).
 * DESLIGADO (vazio = não envia) até confirmar os nomes oficiais na documentação da Disrupty:
 * nome errado não preenche nada e ainda põe dado pessoal na URL.
 */
export const CHECKOUT_PREFILL = { name: "", email: "", phone: "" };

/** ID do Meta Pixel. Vazio desliga o pixel. */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

export const OFFER = {
  name: "ALPHA LAUNCH",
  price: 67.97,
  priceLabel: "R$ 67,97",
};

/** Aplicação do ALPHA OPERATOR (Tally). `origem` identifica quem veio do low ticket. */
export const APPLICATION_URL = "https://tally.so/r/kd1z5Z?origem=lowticket";

/** Link da aplicação para a ALPHA Mentorship (formulário, WhatsApp…). Vazio = botão não aparece. */
export const MENTORSHIP_URL = process.env.NEXT_PUBLIC_MENTORSHIP_URL || "";
