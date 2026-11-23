// Normalização do payload do webhook do checkout (Disrupty).
//
// Contrato oficial (app.disruptybr.app/docs/webhook, Gateway v6.7.0; ver docs/operations/DISRUPTY-INTEGRATION-REPORT.md):
// POST com `id` (ID único da venda, usado para idempotência), `productId`, `status`, `amount` (centavos),
// `customerEmail`, `customerName`, `customerPhone`, `saleItems[]`; até 3 reenvios (5, 15 e 30 min); resposta em até 5 s.
// Status oficiais: PAGO · PENDENTE · EM_PROCESSAMENTO · RECUSADO · CANCELADO · ESTORNADO.
// Os valores em inglês (paid, refunded, chargedback…) vêm da documentação antiga e continuam aceitos.
// AINDA NÃO confirmado: segredo/algoritmo do header X-Signature, status de chargeback e se CANCELADO pode
// chegar depois de PAGO. Os campos continuam achados por padrão de nome; conferir o 1º evento de teste nos logs (`[checkout]`).
// Hipótese de que o bloqueio depende: o evento de estorno traz o MESMO id de transação do `paid`.
// Se vier outro id, o estorno não bloqueia ninguém e loga "estorno sem compra registrada" (conferir no 1º estorno de teste).

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

/** Status de pagamento da Disrupty (já em minúsculas). Só PAGO/paid libera acesso; `authorized` ainda não é dinheiro
 *  capturado. CANCELADO não bloqueia: a doc não diz se chega depois de um PAGO (fica registrado no log). */
export const DISRUPTY_STATUS = {
  approved: ["pago", "paid"],
  revoked: ["estornado", "refunded", "chargedback"],
  pending: ["pendente", "em_processamento", "authorized", "processing", "waiting_payment"],
  refused: ["recusado", "cancelado", "refused"],
} as const;

const KNOWN = new Set<string>(Object.values(DISRUPTY_STATUS).flat());
/** Grupo do status (approved/revoked/pending/refused). A ambiguidade compara o grupo, não o texto: PAGO e paid juntos não conflitam. */
const groupOf = (v: string) => (Object.keys(DISRUPTY_STATUS) as (keyof typeof DISRUPTY_STATUS)[]).find((g) => (DISRUPTY_STATUS[g] as readonly string[]).includes(v));

export type Kind = "approved" | "revoked" | null;

export function kindOf(status: string): Kind {
  const s = status.toLowerCase();
  if ((DISRUPTY_STATUS.approved as readonly string[]).includes(s)) return "approved";
  if ((DISRUPTY_STATUS.revoked as readonly string[]).includes(s)) return "revoked";
  return null;
}

// O payload pode trazer dados de quem vende ou indica (produtor, afiliado…): nunca são do comprador.
const NOT_BUYER = /(producer|produtor|seller|vendedor|affiliate|afiliado|owner|merchant|company|empresa|store|loja|support|suporte)/;
const BUYER = /(buyer|customer|client|comprador|cliente|contact)/;

// Campos que identificam a transação, do mais para o menos específico. `id` de topo é o último recurso.
const TXN_KEYS = [
  /(^|\.)(transaction|transaction_id|transaction\.id)$/,
  /(^|\.)(order_id|order_ref|order\.id)$/,
  /(^|\.)(sale_id|purchase\.id)$/,
  /(^|\.)(payment_id|charge_id)$/,
  /^id$/,
];

const REF_KEYS = /(^|\.)(externalid|external_id|externaltransactionid|external_transaction_id|externalreference|external_reference|src)$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Valor do comprador: prefere chaves de comprador, ignora as de vendedor. Mais de um valor distinto = ambíguo (""). */
function buyerField(f: Flat, key: RegExp, value: RegExp, norm: (v: string) => string): string {
  const all = Object.entries(f).filter(([k, v]) => key.test(k) && !NOT_BUYER.test(k) && value.test(norm(v)));
  const pool = all.some(([k]) => BUYER.test(k)) ? all.filter(([k]) => BUYER.test(k)) : all;
  const distinct = [...new Set(pool.map(([, v]) => norm(v)))];
  return distinct.length === 1 ? distinct[0] : "";
}

export function normalize(body: unknown) {
  const f = flatten(body);
  const email = buyerField(f, /e-?mail/, /^\S+@\S+\.\S+$/, (v) => v.trim().toLowerCase());
  const nome = pick(f, /(buyer|customer|client|comprador|cliente|contact).*(first_?name|name|nome)$|^(name|nome)$/);
  const whatsapp = buyerField(f, /(phone|telefone|celular|mobile|whatsapp)/, /^\d{8,}$/, (v) => v.replace(/\D/g, ""));
  // Status: o valor conhecido da Disrupty nos campos *status. Dois valores conhecidos diferentes (ex.: reembolso
  // que ainda carrega o `paid` antigo) = ambíguo: não decide pela ordem do JSON. Sem valor conhecido: o primeiro *status (só para log).
  const statuses = Object.entries(f).filter(([k]) => /(^|\.|_)status$/.test(k));
  const known = [...new Set(statuses.map(([, v]) => v.trim().toLowerCase()).filter((v) => KNOWN.has(v)))];
  const groups = new Set(known.map(groupOf));
  const ambiguous = groups.size > 1 ? known : [];
  const status = groups.size === 1 ? known[0] : known.length ? "" : (statuses[0]?.[1] ?? "").trim().toLowerCase();
  // sck = "<rota>-<respostas>", repassado pelo quiz no link do checkout (se a Disrupty devolver).
  const sck = pick(f, /(^|\.)(sck|src|tracking\.source|utm_content)$/, /^[a-z]+-\d+$/);
  // Id da transação (idempotência e vínculo pagamento ↔ estorno): por prioridade de nome, nunca pela ordem do JSON,
  // que pode mudar entre o evento `paid` e o de estorno. Dois valores diferentes no mesmo nível = ambíguo ("").
  let txn = "";
  for (const key of TXN_KEYS) {
    const vals = [...new Set(Object.entries(f).filter(([k, v]) => key.test(k) && v.trim()).map(([, v]) => v.trim()))];
    if (vals.length) {
      txn = vals.length === 1 ? vals[0] : "";
      break;
    }
  }
  // Id/código do produto: só o ALPHA LAUNCH (lista em CHECKOUT_PRODUCT_IDS) libera acesso.
  const products = Object.entries(f)
    .filter(([k]) => /(product|produto|offer|oferta|sku|plan|item)s?(\.\d+)?\.?(id|code|codigo|sku|ucode|hash)$|(^|\.)(sku|product_id|offer_id|offer_code|product_hash)$/.test(k))
    .map(([, v]) => v.trim())
    .filter(Boolean);
  // Conta que iniciou o checkout: /comprar põe o id do usuário (UUID aleatório) em `externalId` no link da Disrupty.
  // É por ele que o acesso é liberado, nunca pelo e-mail. Dois valores diferentes = ambíguo ("").
  const refs = [...new Set(Object.entries(f).filter(([k, v]) => REF_KEYS.test(k) && UUID.test(v.trim())).map(([, v]) => v.trim().toLowerCase()))];
  const ref = refs.length === 1 ? refs[0] : "";
  return { email, nome, whatsapp, status, ambiguous, sck, txn, products, ref };
}

/** Só os nomes dos campos (sem valores): para descobrir o formato real no primeiro evento sem gravar dados pessoais. */
export const payloadKeys = (body: unknown) => Object.keys(flatten(body)).slice(0, 60);
