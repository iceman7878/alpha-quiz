// Configuração central do funil. Tudo que muda com frequência mora aqui.

/**
 * Link do checkout do ALPHA LAUNCH.
 * Plataforma ainda não definida: troque via NEXT_PUBLIC_CHECKOUT_URL (Vercel → Environment Variables)
 * ou altere o fallback abaixo. É o ÚNICO lugar onde o link existe.
 * O order bump (Content Vault, R$ 17,97) é configurado na própria plataforma de checkout.
 */
export const CHECKOUT_URL =
  process.env.NEXT_PUBLIC_CHECKOUT_URL || "https://checkout.exemplo.com/alpha-launch";

/**
 * Nomes dos parâmetros de pré-preenchimento do checkout (nome, e-mail, telefone).
 * Ajuste para os nomes que a plataforma escolhida aceitar. Vazio = não envia.
 */
export const CHECKOUT_PREFILL = { name: "name", email: "email", phone: "phone" };

/** ID do Meta Pixel. Vazio desliga o pixel. */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

export const OFFER = {
  name: "ALPHA LAUNCH",
  price: 67.97,
  priceLabel: "R$ 67,97",
};

/** Link da aplicação para a ALPHA Mentorship (formulário, WhatsApp…). Vazio = botão não aparece. */
export const MENTORSHIP_URL = process.env.NEXT_PUBLIC_MENTORSHIP_URL || "";
