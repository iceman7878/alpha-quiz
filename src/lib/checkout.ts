// Normalização do payload do webhook do checkout (plataforma ainda não definida).

type Flat = Record<string, string>;

function flatten(obj: unknown, prefix = "", out: Flat = {}): Flat {
  if (obj && typeof obj === "object") {
    for (const [k, val] of Object.entries(obj as Record<string, unknown>)) flatten(val, prefix ? `${prefix}.${k}` : k, out);
  } else if (obj !== null && obj !== undefined) {
    out[prefix.toLowerCase()] = String(obj);
  }
  return out;
}

function pick(flat: Flat, key: RegExp, value?: RegExp): string {
  for (const [k, val] of Object.entries(flat)) if (key.test(k) && (!value || value.test(val))) return val.trim();
  return "";
}

export function normalize(body: unknown) {
  const f = flatten(body);
  const email = pick(f, /(buyer|customer|client|comprador|cliente|contact|user)?.*e-?mail/, /^\S+@\S+\.\S+$/).toLowerCase();
  const nome = pick(f, /(buyer|customer|client|comprador|cliente|contact).*(first_?name|name|nome)$|^(name|nome)$/);
  const whatsapp = pick(f, /(phone|telefone|celular|mobile|whatsapp)/).replace(/\D/g, "");
  const status = pick(f, /(status|event|webhook_event_type|order_status|evento)$/);
  // sck = "<rota>-<respostas>", repassado pelo quiz no link do checkout.
  const sck = pick(f, /(^|\.)(sck|src|tracking\.source|utm_content)$/, /^[a-z]+-\d+$/);
  // Id da transação/pedido (idempotência) e do produto/oferta (só o ALPHA LAUNCH libera acesso).
  const txn = pick(f, /(^|\.)(transaction|transaction_id|order_id|order_ref|sale_id|purchase\.id|order\.id|payment_id|charge_id)$/);
  const products = Object.entries(f)
    .filter(([k]) => /(product|produto|offer|oferta|sku|plan|item)s?(\.\d+)?\.?(id|code|codigo|sku|ucode)$|(^|\.)(sku|product_id|offer_id|offer_code)$/.test(k))
    .map(([, v]) => v.trim())
    .filter(Boolean);
  return { email, nome, whatsapp, status, sck, txn, products };
}

export const APPROVED = /approved|aprovad|paid|pago|complete|conclu|purchase_approved|order_approved/i;
export const REVOKED = /refund|reembols|chargeback|estorn|cancel|dispute|protest/i;
