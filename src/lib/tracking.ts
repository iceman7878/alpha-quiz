// Captura de UTM + eventos do Meta Pixel. Tudo client-side e tolerante a falhas.

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const;
const STORAGE_KEY = "alpha_utm";

export type Utm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

/** Lê UTMs da URL e guarda (first-touch: não sobrescreve o que já existe). */
export function captureUtm(): Utm {
  let stored: Utm = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {}
  const params = new URLSearchParams(window.location.search);
  const incoming: Utm = {};
  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) incoming[k] = v;
  }
  const merged = Object.keys(stored).length ? { ...incoming, ...stored } : incoming;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {}
  return merged;
}

/** Monta o link final do checkout com UTMs + perfil + respostas. */
export function buildCheckoutUrl(base: string, utm: Utm, extra: Record<string, string>): string {
  const url = new URL(base);
  for (const [k, v] of Object.entries(utm)) if (v) url.searchParams.set(k, v);
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v);
  return url.toString();
}

type Fbq = (...args: unknown[]) => void;

function fbq(): Fbq | null {
  const f = (window as unknown as { fbq?: Fbq }).fbq;
  return typeof f === "function" ? f : null;
}

export function track(event: string, data?: Record<string, unknown>) {
  fbq()?.("track", event, data);
}

export function trackCustom(event: string, data?: Record<string, unknown>) {
  fbq()?.("trackCustom", event, data);
}
