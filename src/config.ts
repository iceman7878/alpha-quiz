// Configuração central do funil. Tudo que muda com frequência mora aqui.

/**
 * Link do checkout do Mapa de Distribuição.
 * Plataforma ainda não definida: troque via NEXT_PUBLIC_CHECKOUT_URL (Vercel → Environment Variables)
 * ou altere o fallback abaixo. É o ÚNICO lugar onde o link existe.
 */
export const CHECKOUT_URL =
  process.env.NEXT_PUBLIC_CHECKOUT_URL || "https://checkout.exemplo.com/mapa-de-distribuicao";

/** ID do Meta Pixel. Vazio desliga o pixel. */
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

export const OFFER = {
  name: "Mapa de Distribuição",
  price: 27,
  priceLabel: "R$ 27",
};
