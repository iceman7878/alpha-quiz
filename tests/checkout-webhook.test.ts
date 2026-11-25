// Testes do webhook do checkout com um Supabase falso em memória (nada de rede, nada de banco real).
// Rodar: npx tsx --test tests/*.test.ts
//
// ATENÇÃO: o payload abaixo é ILUSTRATIVO. Os nomes de campo reais da Disrupty ainda não foram
// confirmados; estes testes validam as regras (status, idempotência, produto, assinatura, acesso),
// não o contrato da plataforma. O primeiro evento de teste real confere o formato.

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { handleCheckoutWebhook, webhookEnv, type WebhookEnv } from "../src/lib/checkout-webhook";
import { kindOf } from "../src/lib/checkout";
import { leadRow } from "../src/lib/lead";
import { buildCheckoutUrl } from "../src/lib/tracking";
import { CHECKOUT_PREFILL } from "../src/config";

type Row = Record<string, unknown>;
/** Conta que iniciou o checkout (vem no externalId do link da Disrupty). */
const UID = "11111111-1111-4111-8111-111111111111";

function fakeDb(
  opts: {
    users?: Record<string, string>;
    /** Contas do Auth (id → e-mail). A conta UID já existe por padrão. */
    accounts?: Record<string, string>;
    leads?: Row[];
    failInvite?: boolean;
    failUpsert?: boolean;
    failSelect?: string;
    failDelete?: boolean;
    failUpdate?: string;
    /** Contas criadas em /comprar com hash do CPF/CNPJ (busca user_id_by_email_doc). */
    docAccounts?: { email: string; hash: string; id: string }[];
    /** Roda antes de gravar uma linha (para simular outra entrega no meio). */
    beforeInsert?: (t: string, row: Row) => Promise<void> | void;
  } = {},
) {
  const tables: Record<string, Row[]> = { checkout_events: [], members: [], leads: [...(opts.leads ?? [])] };
  const users = new Map(Object.entries(opts.users ?? {}));
  const accounts = new Map<string, string>([[UID, "comprador@exemplo.com"], ...Object.entries(opts.accounts ?? {})]);
  /** Contas resolvidas pelo webhook (uma por entrega que chegou a liberar). */
  const invites: { email: string; redirectTo?: string }[] = [];
  let failInvite = !!opts.failInvite;
  let n = 0;

  const rows = (t: string) => (tables[t] ??= []);
  const query = (t: string, filter: (r: Row) => boolean) => {
    const error = opts.failSelect === t ? { message: "select falhou" } : null;
    const found = () => (error ? [] : rows(t).filter(filter));
    const list = {
      eq: (c: string, v: unknown) => query(t, (r) => filter(r) && r[c] === v),
      in: (c: string, vs: unknown[]) => query(t, (r) => filter(r) && vs.includes(r[c])),
      order: () => list,
      limit: (k: number) => ({ data: error ? null : [...found()].reverse().slice(0, k), error }),
      maybeSingle: () => ({ data: error ? null : (found()[0] ?? null), error }),
      // `await db.from().select().eq()` sem order/limit (supabase-js devolve { data, error }).
      get data() {
        return error ? null : found();
      },
      error,
    };
    return list;
  };

  const db = {
    from(t: string) {
      return {
        select: () => ({
          eq: (c: string, v: unknown) => query(t, (r) => r[c] === v),
          in: (c: string, vs: unknown[]) => query(t, (r) => vs.includes(r[c])),
          like: (c: string, p: string) => query(t, (r) => String(r[c] ?? "").endsWith(p.replace(/^%/, ""))),
        }),
        async insert(row: Row) {
          await opts.beforeInsert?.(t, row);
          if (t === "checkout_events" && rows(t).some((r) => r.id === row.id)) return { error: { code: "23505", message: "duplicate key" } };
          rows(t).push({ ...row });
          return { error: null };
        },
        // delete().eq().lt(): filtros encadeados, executados no await (como o supabase-js).
        delete: () => {
          const conds: ((r: Row) => boolean)[] = [];
          const b = {
            eq(c: string, v: unknown) {
              conds.push((r) => r[c] === v);
              return b;
            },
            lt(c: string, v: string) {
              conds.push((r) => r[c] !== undefined && new Date(String(r[c])).getTime() < new Date(v).getTime());
              return b;
            },
            then(ok: (x: unknown) => unknown, ko?: (e: unknown) => unknown) {
              if (opts.failDelete) return Promise.resolve({ error: { message: "delete falhou" } }).then(ok, ko);
              tables[t] = rows(t).filter((r) => !conds.every((f) => f(r)));
              return Promise.resolve({ error: null }).then(ok, ko);
            },
          };
          return b;
        },
        // update().eq().is().lt().select(): filtros encadeados; executa no await, de uma vez (atômico como um UPDATE).
        update: (patch: Row) => {
          const conds: ((r: Row) => boolean)[] = [];
          const b = {
            eq(c: string, v: unknown) {
              conds.push((r) => r[c] === v);
              return b;
            },
            is(c: string, v: null) {
              conds.push((r) => (r[c] ?? null) === v);
              return b;
            },
            lt(c: string, v: string) {
              conds.push((r) => r[c] !== undefined && new Date(String(r[c])).getTime() < new Date(v).getTime());
              return b;
            },
            select: () => b,
            then(ok: (x: unknown) => unknown, ko?: (e: unknown) => unknown) {
              if (opts.failUpdate === t) return Promise.resolve({ data: null, error: { message: "update falhou" } }).then(ok, ko);
              const hit = rows(t).filter((r) => conds.every((f) => f(r)));
              for (const r of hit) Object.assign(r, patch);
              return Promise.resolve({ data: hit.map((r) => ({ id: r.id })), error: null }).then(ok, ko);
            },
          };
          return b;
        },
        upsert(row: Row) {
          if (opts.failUpsert) return { error: { message: "upsert falhou" } };
          const cur = rows(t).find((r) => r.id === row.id);
          if (cur) Object.assign(cur, row);
          else rows(t).push({ ...row });
          return { error: null };
        },
      };
    },
    auth: {
      admin: {
        async getUserById(id: string) {
          if (failInvite) return { data: { user: null }, error: { message: "Auth indisponível" } };
          const email = accounts.get(id);
          if (!email) return { data: { user: null }, error: { message: "User not found" } };
          invites.push({ email });
          return { data: { user: { id, email } }, error: null };
        },
        async inviteUserByEmail(email: string, o?: { redirectTo?: string }) {
          if (failInvite) return { data: { user: null }, error: { message: "SMTP indisponível" } };
          invites.push({ email, redirectTo: o?.redirectTo });
          if (users.has(email)) return { data: { user: null }, error: { message: "A user with this email address has already been registered" } };
          const id = `user-${++n}`;
          users.set(email, id);
          return { data: { user: { id } }, error: null };
        },
      },
    },
    async rpc(fn: string, args: Record<string, unknown>) {
      if (fn === "user_id_by_email") return { data: users.get(String(args.p_email)) ?? null, error: null };
      if (fn === "user_id_by_email_doc") {
        const hit = (opts.docAccounts ?? []).find((a) => a.email.toLowerCase() === String(args.p_email).toLowerCase() && a.hash === args.p_doc_hash);
        return { data: hit?.id ?? null, error: null };
      }
      assert.equal(fn, "finalize_checkout_claim");
      // Mesma semântica da função do schema.sql, sem await no meio: atômica em relação às outras entregas.
      if (opts.failUpsert || opts.failUpdate === "checkout_events") return { data: null, error: { message: "finalize falhou" } };
      const ev = rows("checkout_events").find((r) => r.id === args.p_event_id && (r.finalized_at ?? null) === null);
      if (!ev || ev.claim_token !== args.p_token) return { data: "lost", error: null };
      if (rows("checkout_events").some((r) => r.id === `${args.p_txn}:revoked`)) return { data: "revoked", error: null };
      const m = rows("members").find((r) => r.id === args.p_user_id);
      const patch: Row = { id: args.p_user_id, email: args.p_email, access_status: "active" };
      for (const [k, col] of [["p_nome", "nome"], ["p_whatsapp", "whatsapp"], ["p_r", "r"], ["p_route", "route"]] as const) if (args[k] != null) patch[col] = args[k];
      if (m) Object.assign(m, patch);
      else rows("members").push(patch);
      Object.assign(ev, { user_id: args.p_user_id, finalized_at: new Date().toISOString() });
      return { data: "ok", error: null };
    },
  };

  return {
    db: db as unknown as SupabaseClient,
    tables,
    invites,
    users,
    opts,
    setFailInvite: (v: boolean) => (failInvite = v),
  };
}

const TOKEN = "tok-0123456789abcdef0123456789abcdef";
const env = (over: Partial<WebhookEnv> = {}): WebhookEnv => ({
  ...webhookEnv({ CHECKOUT_WEBHOOK_SECRET: TOKEN, CHECKOUT_PRODUCT_IDS: "prod-alpha, prod-alpha-2", NEXT_PUBLIC_SITE_URL: "https://alpha.test" }),
  ...over,
});

const EMAIL = "Comprador@Exemplo.com";
const payload = (over: Record<string, unknown> = {}) => ({
  status: "paid",
  transaction: { id: "txn-1" },
  product: { id: "prod-alpha" },
  customer: { name: "Ana Souza", email: EMAIL, phone: "+55 (11) 98888-7777" },
  tracking: { sck: "servico-012", utm_source: "instagram" },
  amount: 6797,
  externalId: UID,
  ...over,
});

function req(body: unknown, { token = TOKEN, headers = {} as Record<string, string> } = {}) {
  const raw = typeof body === "string" ? body : JSON.stringify(body);
  return new Request(`https://alpha.test/api/checkout${token ? `?token=${token}` : ""}`, { method: "POST", body: raw, headers });
}

// Logs: capturados para checar que não vaza dado pessoal.
let logs: string[] = [];
beforeEach(() => {
  logs = [];
  for (const k of ["info", "warn", "error"] as const) console[k] = (...a: unknown[]) => void logs.push(JSON.stringify(a));
});
const noPii = () => {
  const all = logs.join("\n").toLowerCase();
  for (const s of ["comprador@exemplo.com", "ana souza", "98888"]) assert.ok(!all.includes(s), `log vazou "${s}"`);
};

// ---------- configuração e segurança ----------

// [PLANO B] Testes deste trecho (linhas 141–329 do original) reescritos em 17/11/2026: o original se perdeu com o container.
// Mesmos nomes e mesmas regras do r3; o corpo é novo.

test("sem token ou sem produto configurado: 503 (fechado)", async () => {
  const f = fakeDb();
  for (const e of [env({ token: "" }), env({ productIds: [] })]) {
    const r = await handleCheckoutWebhook(req(payload()), e, f.db);
    assert.deepEqual([r.status, r.body.error], [503, "webhook não configurado"]);
  }
  assert.equal(f.invites.length, 0);
  assert.equal(f.tables.checkout_events.length, 0);
});

test("token errado ou ausente: 401; token no header x-webhook-token é aceito", async () => {
  const f = fakeDb();
  assert.equal((await handleCheckoutWebhook(req(payload(), { token: "tok-errado-0123456789abcdef0123456789" }), env(), f.db)).status, 401);
  assert.equal((await handleCheckoutWebhook(req(payload(), { token: "" }), env(), f.db)).status, 401);
  assert.equal(f.tables.checkout_events.length, 0);
  const r = await handleCheckoutWebhook(req(payload(), { token: "", headers: { "x-webhook-token": TOKEN } }), env(), f.db);
  assert.deepEqual([r.status, r.body.action], [200, "activated"]);
});

test("JSON malformado ou não-objeto: 400, sem escrita", async () => {
  const f = fakeDb();
  for (const raw of ["{nao é json", "42", "null", '"texto"']) {
    const r = await handleCheckoutWebhook(req(raw), env(), f.db);
    assert.deepEqual([r.status, r.body.error], [400, "json"], raw);
  }
  assert.equal(f.tables.checkout_events.length, 0);
  assert.equal(f.invites.length, 0);
});

test("assinatura configurada: ausente/errada → 401; correta (hex, base64, prefixo sha256=) → 200", async () => {
  const secret = "segredo-de-assinatura";
  const e = env({ signatureSecret: secret, signatureHeader: "x-signature" });
  const raw = JSON.stringify(payload());
  const mac = createHmac("sha256", secret).update(raw, "utf8").digest();
  const f = fakeDb();
  assert.equal((await handleCheckoutWebhook(req(raw), e, f.db)).status, 401);
  assert.equal((await handleCheckoutWebhook(req(raw, { headers: { "x-signature": "abc123" } }), e, f.db)).status, 401);
  assert.equal(f.tables.checkout_events.length, 0);
  for (const sig of [mac.toString("hex"), mac.toString("base64"), `sha256=${mac.toString("hex")}`]) {
    const g = fakeDb();
    const r = await handleCheckoutWebhook(req(raw, { headers: { "x-signature": sig } }), e, g.db);
    assert.deepEqual([r.status, r.body.action], [200, "activated"], sig);
  }
});

test("assinatura não configurada: só o token é exigido", async () => {
  const f = fakeDb();
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.deepEqual([r.status, r.body.action], [200, "activated"]);
});

test("sem Supabase configurado: 500 (a Disrupty reenvia)", async () => {
  const r = await handleCheckoutWebhook(req(payload()), env(), null);
  assert.deepEqual([r.status, r.body.error], [500, "supabase não configurado"]);
  const ignored = await handleCheckoutWebhook(req(payload({ status: "processing" })), env(), null);
  assert.equal(ignored.status, 200);
});

test("kindOf: só paid aprova; refunded/chargedback revogam; o resto não muda nada", () => {
  assert.equal(kindOf("paid"), "approved");
  assert.equal(kindOf("PAID"), "approved");
  assert.equal(kindOf("refunded"), "revoked");
  assert.equal(kindOf("chargedback"), "revoked");
  for (const s of ["authorized", "processing", "waiting_payment", "refused", "approved", "chargeback", "", "algo_novo"]) assert.equal(kindOf(s), null, s);
});

test("pagamento aprovado (paid): convida, ativa o membro com a rota do sck e registra o evento", async () => {
  const f = fakeDb();
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.deepEqual([r.status, r.body.action], [200, "activated"]);
  assert.deepEqual(f.invites, [{ email: "comprador@exemplo.com" }]);
  assert.equal(f.tables.members.length, 1);
  const m = f.tables.members[0];
  assert.equal(m.email, "comprador@exemplo.com");
  assert.equal(m.access_status, "active");
  assert.equal(m.r, "012");
  assert.equal(typeof m.route, "string");
  assert.equal(m.whatsapp, "5511988887777");
  assert.equal(m.nome, "Ana Souza");
  // Dados da compra guardados para auditoria/idempotência.
  const { claim_token, claimed_at, finalized_at, ...ev } = f.tables.checkout_events[0];
  assert.equal(f.tables.checkout_events.length, 1);
  assert.deepEqual(ev, { id: "txn-1:approved", txn: "txn-1", kind: "approved", status: "paid", email: "comprador@exemplo.com", user_id: m.id });
  assert.equal(typeof claim_token, "string");
  assert.ok(claimed_at && finalized_at);
  noPii();
});

test("status em maiúsculas (PAID) também aprova", async () => {
  const f = fakeDb();
  const r = await handleCheckoutWebhook(req(payload({ status: "PAID" })), env(), f.db);
  assert.equal(r.body.action, "activated");
  assert.equal(f.tables.members[0].access_status, "active");
});

test("campo status de outra coisa não confunde: vale o status de pagamento conhecido", async () => {
  const f = fakeDb();
  const body = { ...payload(), shipping: { status: "pending_delivery" }, customer: { name: "Ana Souza", email: EMAIL, phone: "+55 (11) 98888-7777", status: "active" } };
  const r = await handleCheckoutWebhook(req(body), env(), f.db);
  assert.equal(r.body.action, "activated");
});

for (const status of ["authorized", "processing", "waiting_payment", "refused", "algo_novo"]) {
  test(`status ${status}: 200 ignorado, nenhum acesso e nenhuma escrita`, async () => {
    const f = fakeDb();
    const r = await handleCheckoutWebhook(req(payload({ status })), env(), f.db);
    assert.deepEqual([r.status, r.body.action], [200, "ignored"]);
    assert.equal(f.invites.length, 0);
    assert.equal(f.tables.members.length, 0);
    assert.equal(f.tables.checkout_events.length, 0);
  });
}

test("pendente e depois paid: só o paid libera", async () => {
  const f = fakeDb();
  await handleCheckoutWebhook(req(payload({ status: "waiting_payment" })), env(), f.db);
  assert.equal(f.tables.members.length, 0);
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.equal(r.body.action, "activated");
  assert.equal(f.tables.members[0].access_status, "active");
});

test("evento duplicado (reenvio): sem segundo convite nem segunda linha", async () => {
  const f = fakeDb();
  await handleCheckoutWebhook(req(payload()), env(), f.db);
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.deepEqual([r.status, r.body.action], [200, "duplicate"]);
  assert.equal(f.invites.length, 1);
  assert.equal(f.tables.members.length, 1);
  assert.equal(f.tables.checkout_events.length, 1);
});

test("falha no convite: 500, marca desfeita; o reenvio seguinte processa", async () => {
  const f = fakeDb({ failInvite: true });
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.deepEqual([r.status, r.body.error], [500, "user"]);
  assert.equal(f.tables.checkout_events.length, 0);
  assert.equal(f.tables.members.length, 0);
  f.setFailInvite(false);
  assert.equal((await handleCheckoutWebhook(req(payload()), env(), f.db)).body.action, "activated");
  assert.equal(f.tables.members[0].access_status, "active");
  noPii();
});

test("falha ao gravar o membro: 500 e marca desfeita", async () => {
  const f = fakeDb({ failUpsert: true });
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.deepEqual([r.status, r.body.error], [500, "db"]);
  assert.equal(f.tables.checkout_events.length, 0);
  assert.equal(f.tables.members.length, 0);
});

test("outro produto: 200 ignorado, sem acesso", async () => {
  const f = fakeDb();
  const r = await handleCheckoutWebhook(req(payload({ product: { id: "prod-outro" } })), env(), f.db);
  assert.deepEqual([r.status, r.body.action, r.body.reason], [200, "ignored", "produto"]);
  assert.equal(f.invites.length, 0);
  assert.equal(f.tables.checkout_events.length, 0);
  noPii();
});

test("sem campo de produto: ignorado (não libera por omissão)", async () => {
  const f = fakeDb();
  const body: Record<string, unknown> = payload();
  delete body.product;
  const r = await handleCheckoutWebhook(req(body), env(), f.db);
  assert.deepEqual([r.status, r.body.action], [200, "ignored"]);
  assert.equal(f.invites.length, 0);
});

test("segundo id da lista CHECKOUT_PRODUCT_IDS também libera; lista em itens também é lida", async () => {
  const a = fakeDb();
  assert.equal((await handleCheckoutWebhook(req(payload({ product: { id: "prod-alpha-2" } })), env(), a.db)).body.action, "activated");
  const b = fakeDb();
  const body: Record<string, unknown> = payload({ items: [{ product_id: "prod-bump" }, { product_id: "prod-alpha" }] });
  delete body.product;
  assert.equal((await handleCheckoutWebhook(req(body), env(), b.db)).body.action, "activated");
});

for (const status of ["refunded", "chargedback"]) {
  test(`${status}: bloqueia o acesso (dados mantidos)`, async () => {
    const f = fakeDb();
    await handleCheckoutWebhook(req(payload()), env(), f.db);
    const r = await handleCheckoutWebhook(req(payload({ status })), env(), f.db);
    assert.deepEqual([r.status, r.body.action], [200, "blocked"]);
    const m = f.tables.members[0];
    assert.equal(m.access_status, "blocked");
    assert.equal(m.r, "012");
    assert.equal(f.tables.members.length, 1);
  });
}

test("paid atrasado depois do reembolso da mesma transação não reativa", async () => {
  const f = fakeDb();
  await handleCheckoutWebhook(req(payload()), env(), f.db);
  await handleCheckoutWebhook(req(payload({ status: "refunded" })), env(), f.db);
  f.tables.checkout_events = f.tables.checkout_events.filter((e) => e.kind !== "approved"); // simula paid nunca processado
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.equal(r.body.reason, "já reembolsada");
  assert.equal(f.tables.members[0].access_status, "blocked");
});

test("nova compra (outra transação) depois do reembolso reativa", async () => {
  const f = fakeDb();
  await handleCheckoutWebhook(req(payload()), env(), f.db);
  await handleCheckoutWebhook(req(payload({ status: "refunded" })), env(), f.db);
  const r = await handleCheckoutWebhook(req(payload({ transaction: { id: "txn-2" } })), env(), f.db);
  assert.equal(r.body.action, "activated");
  assert.equal(f.tables.members[0].access_status, "active");
});

test("reembolso sem membro (nunca liberado): 200, nada criado", async () => {
  const f = fakeDb();
  const r = await handleCheckoutWebhook(req(payload({ status: "refunded" })), env(), f.db);
  assert.deepEqual([r.status, r.body.action, r.body.reason], [200, "ignored", "sem compra"]);
  assert.equal(f.tables.members.length, 0);
});

// ---------- comprador novo x existente ----------

test("comprador que já tem conta: reativa via user_id_by_email, sem criar outro usuário", async () => {
  const f = fakeDb();
  f.tables.members.push({ id: UID, email: "comprador@exemplo.com", access_status: "blocked", score: 5 });
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.equal(r.body.action, "activated");
  assert.equal(f.tables.members.length, 1);
  const m = f.tables.members[0];
  assert.equal(m.id, UID);
  assert.equal(m.access_status, "active");
  assert.equal(m.score, 5);
});

test("recompra sem sck nem lead: não apaga a rota já salva", async () => {
  const f = fakeDb();
  f.tables.members.push({ id: UID, email: "comprador@exemplo.com", access_status: "blocked", r: "210", route: "produto" });
  const body: Record<string, unknown> = payload();
  delete body.tracking;
  await handleCheckoutWebhook(req(body), env(), f.db);
  assert.deepEqual([f.tables.members[0].r, f.tables.members[0].route], ["210", "produto"]);
});

// ---------- rota pelo lead do quiz ----------

test("sem sck: rota vem do lead mais recente pelo e-mail", async () => {
  const f = fakeDb({ leads: [{ email: "comprador@exemplo.com", whatsapp: "11988887777", r: "000" }, { email: "comprador@exemplo.com", whatsapp: "11988887777", r: "111" }] });
  const body: Record<string, unknown> = payload();
  delete body.tracking;
  await handleCheckoutWebhook(req(body), env(), f.db);
  assert.equal(f.tables.members[0].r, "111");
});

test("sem sck e e-mail diferente no checkout: rota vem do lead pelo WhatsApp (8 últimos dígitos)", async () => {
  const f = fakeDb({ leads: [{ email: "outro@exemplo.com", whatsapp: "11988887777", r: "201" }] });
  const body: Record<string, unknown> = payload();
  delete body.tracking;
  await handleCheckoutWebhook(req(body), env(), f.db);
  assert.equal(f.tables.members[0].r, "201");
});

test("sck inválido é descartado e não quebra", async () => {
  const f = fakeDb();
  const r = await handleCheckoutWebhook(req(payload({ tracking: { sck: "servico-999999" } })), env(), f.db);
  assert.equal(r.body.action, "activated");
  assert.equal(f.tables.members[0].r, undefined);
});

// ---------- payload incompleto ----------

test("paid sem conta vinculada (externalId) ou sem transação: 422, sem escrita, sem PII no log", async () => {
  const f = fakeDb();
  const a = await handleCheckoutWebhook(req(payload({ externalId: undefined })), env(), f.db);
  const b = await handleCheckoutWebhook(req(payload({ transaction: undefined })), env(), f.db);
  assert.equal(a.status, 422);
  assert.equal(b.status, 422);
  assert.equal(f.tables.checkout_events.length, 0);
  assert.equal(f.invites.length, 0);
  noPii();
});

// ---------- auditoria 29/10: configuração, ambiguidade, ordem e corrida ----------

test("configuração inválida fecha (503) sem revelar o motivo: token curto, assinatura pela metade", async () => {
  const f = fakeDb();
  const cases = [env({ token: "curto-demais" }), env({ signatureSecret: "s3cr3t" }), env({ signatureHeader: "x-signature" })];
  for (const e of cases) {
    const r = await handleCheckoutWebhook(req(payload(), { token: e.token }), e, f.db);
    assert.deepEqual([r.status, r.body.error], [503, "webhook não configurado"]);
  }
  assert.equal(f.invites.length, 0);
});

test("status ambíguo (dois status conhecidos diferentes): 422 nas duas ordens do JSON, nada muda", async () => {
  for (const body of [payload({ status: "paid", payment: { status: "refunded" } }), { payment: { status: "refunded" }, ...payload({ status: "paid" }) }]) {
    const f = fakeDb();
    const r = await handleCheckoutWebhook(req(body), env(), f.db);
    assert.deepEqual([r.status, r.body.error], [422, "status ambíguo"]);
    assert.equal(f.invites.length, 0);
    assert.equal(f.tables.checkout_events.length, 0);
  }
  // O mesmo status repetido em dois campos não é ambíguo.
  const f = fakeDb();
  const r = await handleCheckoutWebhook(req(payload({ payment: { status: "paid" } })), env(), f.db);
  assert.equal(r.body.action, "activated");
});

test("e-mail e telefone do produtor/afiliado no payload não recebem o acesso", async () => {
  const f = fakeDb();
  const body = { producer: { email: "produtor@alpha.test", phone: "5511900001111" }, affiliate: { email: "afiliado@x.test" }, ...payload() };
  const r = await handleCheckoutWebhook(req(body), env(), f.db);
  assert.equal(r.body.action, "activated");
  assert.deepEqual(f.invites.map((i) => i.email), ["comprador@exemplo.com"]);
  assert.equal(f.tables.members[0].whatsapp, "5511988887777");
});

test("o acesso vai para a conta do externalId, nunca para um e-mail do payload", async () => {
  const f = fakeDb({ accounts: { "22222222-2222-4222-8222-222222222222": "outra@x.test" } });
  const r = await handleCheckoutWebhook(req(payload({ customer: { name: "Ana Souza" }, email: "a@x.test", user: { email: "b@x.test" } })), env(), f.db);
  assert.equal(r.body.action, "activated");
  assert.deepEqual(f.tables.members.map((m) => [m.id, m.email]), [[UID, "comprador@exemplo.com"]]);
  noPii();
});

test("externalId de conta inexistente ou ambíguo: 422, nenhuma marca, ninguém recebe acesso", async () => {
  const f = fakeDb();
  const a = await handleCheckoutWebhook(req(payload({ externalId: "33333333-3333-4333-8333-333333333333" })), env(), f.db);
  const b = await handleCheckoutWebhook(req(payload({ src: "22222222-2222-4222-8222-222222222222" })), env(), f.db);
  assert.deepEqual([a.status, b.status], [422, 422]);
  assert.equal(f.tables.checkout_events.length, 0);
  assert.equal(f.tables.members.length, 0);
});

test("pagou duas vezes e estornou uma: acesso continua; estorno da segunda bloqueia", async () => {
  const f = fakeDb();
  await handleCheckoutWebhook(req(payload()), env(), f.db);
  await handleCheckoutWebhook(req(payload({ transaction: { id: "txn-2" } })), env(), f.db);
  const a = await handleCheckoutWebhook(req(payload({ status: "refunded" })), env(), f.db);
  assert.equal(a.body.action, "kept");
  assert.equal(f.tables.members[0].access_status, "active");
  const b = await handleCheckoutWebhook(req(payload({ status: "chargedback", transaction: { id: "txn-2" } })), env(), f.db);
  assert.equal(b.body.action, "blocked");
  assert.equal(f.tables.members[0].access_status, "blocked");
  const c = await handleCheckoutWebhook(req(payload({ status: "refunded" })), env(), f.db);
  assert.equal(c.body.action, "duplicate");
  assert.equal(f.tables.members[0].access_status, "blocked");
});

test("reenvio do estorno antigo depois de uma nova compra não bloqueia", async () => {
  const f = fakeDb();
  await handleCheckoutWebhook(req(payload()), env(), f.db);
  await handleCheckoutWebhook(req(payload({ status: "refunded" })), env(), f.db);
  await handleCheckoutWebhook(req(payload({ transaction: { id: "txn-2" } })), env(), f.db);
  const r = await handleCheckoutWebhook(req(payload({ status: "refunded" })), env(), f.db);
  assert.deepEqual([r.status, r.body.action], [200, "duplicate"]);
  assert.equal(f.tables.members[0].access_status, "active");
});

test("estorno chega antes do paid (fora de ordem): o paid atrasado não libera", async () => {
  const f = fakeDb();
  await handleCheckoutWebhook(req(payload({ status: "chargedback" })), env(), f.db);
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.equal(r.body.reason, "já reembolsada");
  assert.equal(f.invites.length, 0);
  assert.equal(f.tables.members.length, 0);
});

test("reenvio encontra a marca sem o acesso pronto (outra entrega processando): 409, não 200", async () => {
  const f = fakeDb();
  f.tables.checkout_events.push({ id: "txn-1:approved", txn: "txn-1", kind: "approved", status: "paid", email: "comprador@exemplo.com" });
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.deepEqual([r.status, r.body.error], [409, "em processamento"]);
  assert.equal(f.invites.length, 0);
});

test("duas entregas simultâneas do mesmo paid: um convite só; a outra é 409 ou duplicado com acesso pronto", async () => {
  const f = fakeDb();
  const rs = await Promise.all([handleCheckoutWebhook(req(payload()), env(), f.db), handleCheckoutWebhook(req(payload()), env(), f.db)]);
  assert.equal(f.invites.length, 1);
  assert.equal(rs.filter((r) => r.body.action === "activated").length, 1);
  const other = rs.find((r) => r.body.action !== "activated")!;
  assert.ok(other.status === 409 || (other.body.action === "duplicate" && f.tables.members[0].access_status === "active"));
});

test("falha no meio e a marca não pôde ser desfeita: reenvio recebe 409, nunca 200 sem acesso", async () => {
  const f = fakeDb({ failInvite: true, failDelete: true });
  assert.equal((await handleCheckoutWebhook(req(payload()), env(), f.db)).status, 500);
  f.setFailInvite(false);
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.equal(r.status, 409);
  assert.equal(f.tables.members.length, 0);
});

test("erro ao consultar reembolso: 500 e nenhum acesso", async () => {
  const f = fakeDb({ failSelect: "checkout_events" });
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.equal(r.status, 500);
  assert.equal(f.invites.length, 0);
  assert.equal(f.tables.checkout_events.length, 0);
});

test("erro de banco no estorno: 500, marca mantida (barra o paid atrasado), acesso não muda; o reenvio bloqueia", async () => {
  const f = fakeDb();
  await handleCheckoutWebhook(req(payload()), env(), f.db);
  f.opts.failSelect = "checkout_events";
  const r = await handleCheckoutWebhook(req(payload({ status: "refunded" })), env(), f.db);
  assert.equal(r.status, 500);
  f.opts.failSelect = undefined;
  assert.deepEqual(f.tables.checkout_events.map((e) => e.id), ["txn-1:approved", "txn-1:revoked"]);
  assert.equal(f.tables.members[0].access_status, "active");
  // Reenvio do paid nesse intervalo: não reativa e aplica o bloqueio pendente.
  assert.equal((await handleCheckoutWebhook(req(payload()), env(), f.db)).body.reason, "já reembolsada");
  assert.equal(f.tables.members[0].access_status, "blocked");
  // Reenvio do estorno com o banco de volta: duplicado, segue bloqueado.
  assert.equal((await handleCheckoutWebhook(req(payload({ status: "refunded" })), env(), f.db)).body.action, "duplicate");
  assert.equal(f.tables.members[0].access_status, "blocked");
});

test("erro ao bloquear no estorno: 500 e o reenvio bloqueia", async () => {
  const f = fakeDb();
  await handleCheckoutWebhook(req(payload()), env(), f.db);
  f.opts.failUpdate = "members";
  assert.equal((await handleCheckoutWebhook(req(payload({ status: "refunded" })), env(), f.db)).status, 500);
  f.opts.failUpdate = undefined;
  assert.equal(f.tables.members[0].access_status, "active");
  assert.deepEqual([(await handleCheckoutWebhook(req(payload({ status: "refunded" })), env(), f.db)).status, f.tables.members[0].access_status], [200, "blocked"]);
});

// ---------- auditoria 29/10 (2ª rodada) ----------

test("id da transação não depende da ordem das chaves: estorno com chaves em outra ordem bloqueia", async () => {
  const f = fakeDb();
  const base = { product: { id: "prod-alpha" }, customer: { email: EMAIL }, externalId: UID };
  const paid = await handleCheckoutWebhook(req({ order_id: "ord-9", status: "paid", transaction: { id: "txn-9" }, ...base }), env(), f.db);
  assert.equal(paid.body.action, "activated");
  const refund = await handleCheckoutWebhook(req({ status: "refunded", transaction: { id: "txn-9" }, order_id: "ord-9", ...base }), env(), f.db);
  assert.equal(refund.body.action, "blocked");
  assert.equal(f.tables.members[0].access_status, "blocked");
  assert.deepEqual(f.tables.checkout_events.map((e) => e.id).sort(), ["txn-9:approved", "txn-9:revoked"]);
});

test("e-mail do comprador sem prefixo (topo) ao lado do e-mail do produtor: libera para o comprador", async () => {
  const f = fakeDb();
  const r = await handleCheckoutWebhook(req(payload({ customer: { name: "Ana Souza" }, email: EMAIL, producer: { email: "produtor@alpha.test" } })), env(), f.db);
  assert.equal(r.body.action, "activated");
  assert.deepEqual(f.invites.map((i) => i.email), ["comprador@exemplo.com"]);
});

test("dois ids de transação diferentes no mesmo nível: 422, nada muda", async () => {
  const f = fakeDb();
  const r = await handleCheckoutWebhook(req(payload({ transaction_id: "txn-x" })), env(), f.db);
  assert.deepEqual([r.status, r.body.error], [422, "sem transação"]);
  assert.equal(f.invites.length, 0);
});

// ---------- estorno ↔ compra pela transação (29/10, 3ª rodada) ----------
// O estorno acha a conta pelo registro do `paid` da MESMA transação (conta gravada na hora da liberação),
// nunca pelo e-mail que vem no evento de estorno.

const OUTRO = "outro@exemplo.com";

test("estorno com e-mail diferente do da compra: bloqueia a conta que recebeu o acesso", async () => {
  const f = fakeDb();
  await handleCheckoutWebhook(req(payload()), env(), f.db);
  const r = await handleCheckoutWebhook(req(payload({ status: "refunded", customer: { email: OUTRO } })), env(), f.db);
  assert.deepEqual([r.status, r.body.action], [200, "blocked"]);
  assert.equal(f.tables.members[0].access_status, "blocked");
  // Reenvio do estorno: duplicado, segue bloqueado; o paid atrasado da mesma transação não reativa.
  assert.equal((await handleCheckoutWebhook(req(payload({ status: "refunded", customer: { email: OUTRO } })), env(), f.db)).body.action, "duplicate");
  assert.equal((await handleCheckoutWebhook(req(payload()), env(), f.db)).body.reason, "já reembolsada");
  assert.equal(f.tables.members[0].access_status, "blocked");
  noPii();
});

test("estorno sem e-mail ou com e-mail ambíguo: decide pela transação", async () => {
  const semEmail = payload({ status: "chargedback", customer: { name: "Ana Souza" } });
  const ambiguo = payload({ status: "chargedback", customer: { name: "Ana Souza" }, email: "a@x.test", user: { email: "b@x.test" } });
  for (const body of [semEmail, ambiguo]) {
    const f = fakeDb();
    await handleCheckoutWebhook(req(payload()), env(), f.db);
    const r = await handleCheckoutWebhook(req(body), env(), f.db);
    assert.deepEqual([r.status, r.body.action], [200, "blocked"]);
    assert.equal(f.tables.members[0].access_status, "blocked");
  }
});

test("duas compras e o estorno de uma chega com outro e-mail: acesso continua (kept)", async () => {
  const f = fakeDb();
  await handleCheckoutWebhook(req(payload()), env(), f.db);
  await handleCheckoutWebhook(req(payload({ transaction: { id: "txn-2" } })), env(), f.db);
  const r = await handleCheckoutWebhook(req(payload({ status: "refunded", customer: { email: OUTRO } })), env(), f.db);
  assert.equal(r.body.action, "kept");
  assert.equal(f.tables.members[0].access_status, "active");
});

test("mesma conta com duas compras em e-mails diferentes (e-mail de login trocado): estorno de uma não tira o acesso da outra", async () => {
  const f = fakeDb();
  await handleCheckoutWebhook(req(payload()), env(), f.db);
  // A conta trocou o e-mail de login; a segunda compra veio com o e-mail novo e caiu na mesma conta.
  f.users.set("novo@exemplo.com", f.users.get("comprador@exemplo.com")!);
  const dois = { transaction: { id: "txn-2" }, customer: { email: "novo@exemplo.com" } };
  assert.equal((await handleCheckoutWebhook(req(payload(dois)), env(), f.db)).body.action, "activated");
  assert.equal(f.tables.members.length, 1);
  const a = await handleCheckoutWebhook(req(payload({ ...dois, status: "refunded" })), env(), f.db);
  assert.equal(a.body.action, "kept");
  assert.equal(f.tables.members[0].access_status, "active");
  const b = await handleCheckoutWebhook(req(payload({ status: "refunded" })), env(), f.db);
  assert.equal(b.body.action, "blocked");
  assert.equal(f.tables.members[0].access_status, "blocked");
});

test("estorno de transação sem compra registrada: não bloqueia ninguém e barra o paid atrasado", async () => {
  const f = fakeDb();
  // Acesso que não veio desta transação (ex.: liberado à mão) com o mesmo e-mail do evento.
  f.tables.members.push({ id: "user-manual", email: "comprador@exemplo.com", access_status: "active" });
  const r = await handleCheckoutWebhook(req(payload({ status: "refunded", transaction: { id: "txn-desconhecida" } })), env(), f.db);
  assert.deepEqual([r.status, r.body.action, r.body.reason], [200, "ignored", "sem compra"]);
  assert.equal(f.tables.members[0].access_status, "active");
  assert.deepEqual(f.tables.checkout_events.map((e) => e.id), ["txn-desconhecida:revoked"]);
  const late = await handleCheckoutWebhook(req(payload({ transaction: { id: "txn-desconhecida" } })), env(), f.db);
  assert.equal(late.body.reason, "já reembolsada");
  assert.equal(f.invites.length, 0);
  noPii();
});

test("a liberação grava a conta na transação aprovada", async () => {
  const f = fakeDb();
  await handleCheckoutWebhook(req(payload()), env(), f.db);
  const ev = f.tables.checkout_events.find((e) => e.id === "txn-1:approved")!;
  assert.equal(ev.user_id, f.tables.members[0].id);
});

test("falha ao gravar a conta na transação: 500, marca desfeita, sem acesso", async () => {
  const f = fakeDb({ failUpdate: "checkout_events" });
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.equal(r.status, 500);
  assert.equal(f.tables.checkout_events.length, 0);
  assert.equal(f.tables.members.length, 0);
});

test("estorno processado no meio da liberação (antes do vínculo com a conta): o paid confere no fim e bloqueia", async () => {
  const f = fakeDb();
  const admin = f.db.auth.admin as unknown as { getUserById: (...a: unknown[]) => Promise<unknown> };
  const invite = admin.getUserById.bind(admin);
  let refund: { status: number; body: Record<string, unknown> } | undefined;
  admin.getUserById = async (...a) => {
    const out = await invite(...a);
    refund = await handleCheckoutWebhook(req(payload({ status: "refunded" })), env(), f.db);
    return out;
  };
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.equal(refund?.body.reason, "sem compra"); // a conta ainda não estava ligada à transação
  assert.equal(r.body.reason, "já reembolsada");
  // F05: a liberação confere o estorno dentro da mesma transação, então o acesso nem chega a ser ativado.
  assert.equal(f.tables.members.filter((m) => m.access_status === "active").length, 0);
});

test("paid termina inteiro enquanto o estorno grava a marca: o estorno ainda acha a conta e bloqueia", async () => {
  const f = fakeDb();
  let paid: { body: Record<string, unknown> } | undefined;
  f.opts.beforeInsert = async (t, row) => {
    if (t !== "checkout_events" || row.id !== "txn-1:revoked" || paid) return;
    paid = await handleCheckoutWebhook(req(payload()), env(), f.db);
  };
  const r = await handleCheckoutWebhook(req(payload({ status: "refunded" })), env(), f.db);
  assert.equal(paid?.body.action, "activated");
  assert.equal(r.body.action, "blocked");
  assert.equal(f.tables.members[0].access_status, "blocked");
});

test("paid e estorno da mesma transação ao mesmo tempo: em qualquer ordem, termina sem acesso", async () => {
  for (const order of [0, 1]) {
    const f = fakeDb();
    const calls = [() => handleCheckoutWebhook(req(payload()), env(), f.db), () => handleCheckoutWebhook(req(payload({ status: "refunded" })), env(), f.db)];
    if (order) calls.reverse();
    await Promise.all(calls.map((c) => c()));
    assert.ok(!f.tables.members.some((m) => m.access_status === "active"), `ordem ${order}: acesso ficou ativo`);
  }
});

// ---------- link do checkout ----------

test("link do checkout: mantém parâmetros do link, soma UTMs e sck, não leva dado pessoal com o prefill desligado", () => {
  Object.assign(globalThis, { window: { location: { origin: "https://alpha.test" } } });
  // [PLANO B] Resto deste teste e o teste de leadRow reescritos em 17/11/2026 (o final do arquivo original se perdeu).
  const extra = { sck: "servico-012" };
  for (const [k, v] of [
    ["name", CHECKOUT_PREFILL.name],
    ["email", CHECKOUT_PREFILL.email],
    ["phone", CHECKOUT_PREFILL.phone],
  ] as const) {
    assert.equal(v, "", `prefill de ${k} deveria estar desligado até a Disrupty confirmar o nome do parâmetro`);
  }
  const url = new URL(buildCheckoutUrl("https://pay.exemplo.test/c/alpha?coupon=X", { utm_source: "instagram", utm_campaign: "build" }, extra));
  assert.equal(url.searchParams.get("coupon"), "X");
  assert.equal(url.searchParams.get("utm_source"), "instagram");
  assert.equal(url.searchParams.get("utm_campaign"), "build");
  assert.equal(url.searchParams.get("sck"), "servico-012");
  assert.ok(!/comprador|ana|5511|@/i.test(url.search), "nenhum dado pessoal no link");
});

test("leadRow: grava `rota` (coluna real), não `perfil`; e-mail em minúsculas", () => {
  const row = leadRow({ nome: "Ana", whatsapp: "5511988887777", email: "Ana@Exemplo.COM", perfil: "servico", r: "012", consentimento: true });
  assert.equal(row.rota, "servico");
  assert.equal(row.email, "ana@exemplo.com");
  assert.ok(!("perfil" in row));
  assert.deepEqual(Object.keys(row).sort(), ["consentimento", "email", "nome", "r", "rota", "utm", "whatsapp"]);
  const semEmail = leadRow({ nome: "Bia", whatsapp: "5511977776666", consentimento: true });
  assert.equal(semEmail.email, null);
  assert.equal(semEmail.rota, null);
});

// ---------- contrato oficial da Disrupty (app.disruptybr.app/docs/webhook, 17/11/2026) ----------
// Nomes de campo e status da documentação oficial; os valores são ilustrativos.

const SALE_ID = 90817;
const PRODUCT_ID = 4321;
const officialEnv = () => env({ productIds: [String(PRODUCT_ID)] });
const official = (over: Record<string, unknown> = {}) => ({
  id: SALE_ID,
  userId: 77,
  storeId: 12,
  storeName: "ALPHA",
  productId: PRODUCT_ID,
  productName: "ALPHA LAUNCH — 7-Day Build",
  amount: 6797,
  currency: "BRL",
  netAmount: 6200,
  systemFee: 597,
  date: "2026-11-17T12:00:00.000Z",
  status: "PAGO",
  paymentMethod: "PIX",
  customerDocument: "00000000000",
  customerEmail: EMAIL,
  customerName: "Ana Souza",
  customerPhone: "+55 11 98888-7777",
  pixKey: null,
  boletoCode: null,
  shipping: null,
  saleItems: [{ offerId: 555, name: "ALPHA LAUNCH — 7-Day Build", price: 6797 }],
  externalTransactionId: "adq-abc-123",
  // HIPÓTESE (confirmar no evento de teste): a Disrupty devolve o externalId do link do checkout.
  externalId: UID,
  checkoutTemplateId: 9,
  ...over,
});

test("contrato oficial: PAGO libera; reenvio é idempotente; ESTORNADO com o mesmo id bloqueia", async () => {
  const f = fakeDb();
  const paid = await handleCheckoutWebhook(req(official()), officialEnv(), f.db);
  assert.deepEqual([paid.status, paid.body.action], [200, "activated"]);
  assert.deepEqual(f.invites.map((i) => i.email), ["comprador@exemplo.com"]);
  assert.equal(f.tables.members[0].access_status, "active");
  assert.equal(f.tables.members[0].nome, "Ana Souza");
  assert.equal(f.tables.checkout_events[0].txn, String(SALE_ID));
  assert.equal((await handleCheckoutWebhook(req(official()), officialEnv(), f.db)).body.action, "duplicate");
  assert.equal(f.invites.length, 1);
  const refund = await handleCheckoutWebhook(req(official({ status: "ESTORNADO" })), officialEnv(), f.db);
  assert.deepEqual([refund.status, refund.body.action], [200, "blocked"]);
  assert.equal(f.tables.members[0].access_status, "blocked");
  noPii();
});

test("contrato oficial: PENDENTE, EM_PROCESSAMENTO, RECUSADO e CANCELADO não liberam nem bloqueiam", async () => {
  for (const status of ["PENDENTE", "EM_PROCESSAMENTO", "RECUSADO", "CANCELADO"]) {
    const f = fakeDb();
    const r = await handleCheckoutWebhook(req(official({ status })), officialEnv(), f.db);
    assert.deepEqual([r.status, r.body.action], [200, "ignored"], status);
    assert.equal(f.invites.length, 0, status);
    assert.equal(f.tables.checkout_events.length, 0, status);
  }
  // CANCELADO depois de PAGO não tira o acesso (a doc não diz o que significa nesse caso).
  const f = fakeDb();
  await handleCheckoutWebhook(req(official()), officialEnv(), f.db);
  await handleCheckoutWebhook(req(official({ status: "CANCELADO" })), officialEnv(), f.db);
  assert.equal(f.tables.members[0].access_status, "active");
});

test("contrato oficial: outro productId é ignorado", async () => {
  const f = fakeDb();
  const r = await handleCheckoutWebhook(req(official({ productId: 9999, saleItems: [{ offerId: 1, name: "Outro", price: 100 }] })), officialEnv(), f.db);
  assert.deepEqual([r.status, r.body.action, r.body.reason], [200, "ignored", "produto"]);
  assert.equal(f.invites.length, 0);
});

test("ambiguidade compara o significado: PAGO + paid libera; PAGO + ESTORNADO é 422", async () => {
  const a = fakeDb();
  assert.equal((await handleCheckoutWebhook(req(official({ payment: { status: "paid" } })), officialEnv(), a.db)).body.action, "activated");
  const b = fakeDb();
  const r = await handleCheckoutWebhook(req(official({ payment: { status: "ESTORNADO" } })), officialEnv(), b.db);
  assert.deepEqual([r.status, r.body.error], [422, "status ambíguo"]);
  assert.equal(b.invites.length, 0);
});

test("kindOf: status oficiais em português (qualquer caixa)", () => {
  assert.equal(kindOf("PAGO"), "approved");
  assert.equal(kindOf("pago"), "approved");
  assert.equal(kindOf("ESTORNADO"), "revoked");
  for (const s of ["PENDENTE", "EM_PROCESSAMENTO", "RECUSADO", "CANCELADO"]) assert.equal(kindOf(s), null, s);
});

// ---------- marca abandonada (F05, 17/11/2026) ----------
// A Disrupty só reenvia 3 vezes (5, 15 e 30 min). Uma marca sem efeito que ficou para trás (função interrompida,
// delete falho) não pode prender o comprador para sempre: passado o prazo de uma entrega viva, o reenvio retoma.

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const staleMark = (over: Record<string, unknown> = {}) => ({
  id: "txn-1:approved", txn: "txn-1", kind: "approved", status: "paid", email: "comprador@exemplo.com", created_at: minutesAgo(10), claimed_at: minutesAgo(10), claim_token: "entrega-antiga", ...over,
});

test("marca abandonada (sem efeito, mais velha que o prazo): o reenvio retoma e libera o acesso", async () => {
  const f = fakeDb();
  f.tables.checkout_events.push(staleMark());
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.deepEqual([r.status, r.body.action], [200, "activated"]);
  assert.equal(f.tables.members[0].access_status, "active");
  assert.equal(f.tables.checkout_events.length, 1);
  assert.equal(f.tables.checkout_events[0].user_id, f.tables.members[0].id);
});

test("marca recente sem efeito (outra entrega pode estar viva): continua 409, sem convite", async () => {
  const f = fakeDb();
  f.tables.checkout_events.push(staleMark({ claimed_at: minutesAgo(0.5) }));
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.deepEqual([r.status, r.body.error], [409, "em processamento"]);
  assert.equal(f.invites.length, 0);
});

test("falha no meio sem conseguir desfazer a marca: depois do prazo, o reenvio libera", async () => {
  const f = fakeDb({ failInvite: true, failDelete: true });
  assert.equal((await handleCheckoutWebhook(req(payload()), env(), f.db)).status, 500);
  f.setFailInvite(false);
  f.opts.failDelete = false;
  assert.equal((await handleCheckoutWebhook(req(payload()), env(), f.db)).status, 409);
  f.tables.checkout_events[0].claimed_at = minutesAgo(6); // o 1º reenvio da Disrupty chega depois de 5 min
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.equal(r.body.action, "activated");
  assert.equal(f.tables.members[0].access_status, "active");
});

test("dois reenvios simultâneos sobre a mesma marca abandonada: um convite só", async () => {
  const f = fakeDb();
  f.tables.checkout_events.push(staleMark());
  const rs = await Promise.all([handleCheckoutWebhook(req(payload()), env(), f.db), handleCheckoutWebhook(req(payload()), env(), f.db)]);
  assert.equal(f.invites.length, 1);
  assert.equal(rs.filter((r) => r.body.action === "activated").length, 1);
  assert.equal(f.tables.checkout_events.length, 1);
});

test("marca abandonada não retoma o que já foi estornado", async () => {
  const f = fakeDb();
  f.tables.checkout_events.push(staleMark(), { id: "txn-1:revoked", txn: "txn-1", kind: "revoked", status: "refunded", email: null });
  const r = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.equal(r.body.reason, "já reembolsada");
  assert.equal(f.invites.length, 0);
});

// ---------- posse da trava (F05-b, 17/11/2026) ----------
// Uma execução que perdeu a posse (outra retomou a marca) não pode apagar a marca, conceder acesso nem finalizar.

/** Faz a execução A "travar" dentro do convite e roda `during` nesse momento (a marca de A envelhece antes). */
function stallInvite(f: ReturnType<typeof fakeDb>, during: () => Promise<void>, after?: "before-invite" | "after-invite") {
  const admin = f.db.auth.admin as unknown as { getUserById: (...a: unknown[]) => Promise<unknown> };
  const invite = admin.getUserById.bind(admin);
  let first = true;
  admin.getUserById = async (...a) => {
    if (!first) return invite(...a);
    first = false;
    if (after === "after-invite") {
      const out = await invite(...a);
      age(f);
      await during();
      return out;
    }
    age(f);
    await during();
    return invite(...a);
  };
}
const age = (f: ReturnType<typeof fakeDb>) => {
  const m = f.tables.checkout_events.find((e) => e.id === "txn-1:approved")!;
  for (const k of ["claimed_at", "created_at"]) m[k] = new Date(Date.now() - 3 * 60_000).toISOString();
};

test("posse A: execução antiga falha depois que outra retomou → não apaga nem altera a marca nova", async () => {
  const f = fakeDb();
  let b: { status: number; body: Record<string, unknown> } | undefined;
  stallInvite(f, async () => {
    b = await handleCheckoutWebhook(req(payload()), env(), f.db); // B retoma e conclui
    f.setFailInvite(true); // A volta e falha
  });
  const a = await handleCheckoutWebhook(req(payload()), env(), f.db);
  f.setFailInvite(false);
  assert.equal(b?.body.action, "activated");
  assert.equal(a.status, 500);
  const marks = f.tables.checkout_events.filter((e) => e.id === "txn-1:approved");
  assert.equal(marks.length, 1, "a marca de B continua");
  assert.ok(marks[0].finalized_at, "e continua finalizada");
  assert.equal(marks[0].user_id, f.tables.members[0].id);
  assert.equal(f.tables.members[0].access_status, "active");
});

test("posse B: execução antiga tenta finalizar depois que outra retomou → nenhum efeito", async () => {
  const f = fakeDb();
  stallInvite(f, async () => {
    // B assume a posse (mesma retomada condicional que o código faz) e ainda não finalizou.
    const took = await f.db.from("checkout_events").update({ claim_token: "token-de-B", claimed_at: new Date().toISOString() })
      .eq("id", "txn-1:approved").is("finalized_at", null).lt("claimed_at", new Date(Date.now() - 2 * 60_000).toISOString()).select("id");
    assert.equal((took as unknown as { data: unknown[] }).data.length, 1);
  });
  const a = await handleCheckoutWebhook(req(payload()), env(), f.db);
  assert.equal(a.status, 409, "A perdeu a posse");
  assert.equal(f.tables.members.length, 0, "A não concedeu acesso");
  const mark = f.tables.checkout_events.find((e) => e.id === "txn-1:approved")!;
  assert.equal(mark.claim_token, "token-de-B");
  assert.equal(mark.finalized_at ?? null, null, "A não finalizou");
  assert.equal(mark.user_id ?? null, null, "A não vinculou a conta");
});

test("posse C: entrega retomada depois que A já resolveu a conta → uma conclusão só (sem e-mail: nada a duplicar)", async () => {
  const f = fakeDb();
  let b: { body: Record<string, unknown> } | undefined;
  stallInvite(f, async () => {
    b = await handleCheckoutWebhook(req(payload()), env(), f.db);
  }, "after-invite");
  const a = await handleCheckoutWebhook(req(payload()), env(), f.db);
  const done = [a, b!].filter((r) => r.body.action === "activated");
  assert.equal(done.length, 1, "só uma execução conclui");
  assert.equal(f.tables.members.length, 1);
  assert.equal(f.tables.members[0].access_status, "active");
});

test("posse D: pagamento, retomada e estorno → a execução antiga não reativa o comprador", async () => {
  const f = fakeDb();
  stallInvite(f, async () => {
    await handleCheckoutWebhook(req(payload()), env(), f.db); // B retoma e libera
    const r = await handleCheckoutWebhook(req(payload({ status: "refunded" })), env(), f.db); // estorno chega
    assert.equal(r.body.action, "blocked");
    // A volta e o banco falha logo depois do que A tentar gravar: nenhuma conferência posterior salva o resultado.
    f.opts.failSelect = "checkout_events";
  });
  const a = await handleCheckoutWebhook(req(payload()), env(), f.db); // A volta e tenta concluir
  f.opts.failSelect = undefined;
  assert.notEqual(a.body.action, "activated");
  assert.notEqual(a.body.action, "activated");
  assert.equal(f.tables.members[0].access_status, "blocked");
  assert.ok(f.tables.checkout_events.some((e) => e.id === "txn-1:approved" && e.user_id), "o vínculo da compra continua");
});


// ---------- vínculo por e-mail + CPF/CNPJ (payload oficial da Disrupty não traz o externalId) ----------

import { docHash, validDoc } from "../src/lib/account-doc";

const PEPPER = "pepper-de-teste-0123456789abcdef";
const CPF = "52998224725"; // CPF válido de exemplo (gerador público), não é de ninguém do projeto
const UID2 = "22222222-2222-4222-8222-222222222222";
/** Payload no formato oficial (app.disruptybr.app/docs/webhook, v6.7.0). */
const officialV67 = (over: Record<string, unknown> = {}) => ({
  id: 98765,
  productId: "prod-alpha",
  productName: "ALPHA LAUNCH — 7-Day Build",
  amount: 6797,
  status: "PAGO",
  paymentMethod: "PIX",
  customerDocument: "529.982.247-25",
  customerEmail: EMAIL,
  customerName: "Ana Souza",
  customerPhone: "+5511988887777",
  saleItems: [{ offerId: 1, quantity: 1, price: 6797, name: "ALPHA LAUNCH" }],
  externalTransactionId: "TRX123456",
  ...over,
});

test("validDoc: CPF/CNPJ com dígito verificador; repetidos e tamanhos errados são recusados", () => {
  assert.ok(validDoc(CPF));
  assert.ok(validDoc("11222333000181"));
  for (const d of ["52998224724", "11111111111", "123", "11222333000180", ""]) assert.ok(!validDoc(d), d);
});

test("payload oficial sem externalId: e-mail + CPF batem → libera a conta do /comprar", async () => {
  const f = fakeDb({ accounts: { [UID2]: "comprador@exemplo.com" }, docAccounts: [{ email: "comprador@exemplo.com", hash: docHash(CPF, PEPPER), id: UID2 }] });
  const r = await handleCheckoutWebhook(req(officialV67()), env({ docPepper: PEPPER }), f.db);
  assert.deepEqual([r.status, r.body.action], [200, "activated"]);
  assert.equal(f.tables.members.find((m) => m.id === UID2)?.access_status, "active");
  // estorno da mesma venda (mesmo id) bloqueia essa conta
  const e = await handleCheckoutWebhook(req(officialV67({ status: "ESTORNADO", customerDocument: undefined })), env({ docPepper: PEPPER }), f.db);
  assert.deepEqual([e.status, e.body.action], [200, "blocked"]);
  assert.equal(f.tables.members.find((m) => m.id === UID2)?.access_status, "blocked");
  noPii();
});

test("só o e-mail não basta: CPF diferente, CPF ausente ou sem chave → 422, ninguém recebe acesso", async () => {
  const acc = [{ email: "comprador@exemplo.com", hash: docHash(CPF, PEPPER), id: UID2 }];
  const f = fakeDb({ accounts: { [UID2]: "comprador@exemplo.com" }, docAccounts: acc });
  const cases: [Record<string, unknown>, Partial<WebhookEnv>][] = [
    [{ customerDocument: "111.444.777-35" }, { docPepper: PEPPER }],
    [{ customerDocument: undefined }, { docPepper: PEPPER }],
    [{}, { docPepper: "" }],
  ];
  for (const [over, e] of cases) {
    const r = await handleCheckoutWebhook(req(officialV67(over)), env(e), f.db);
    assert.deepEqual([r.status, r.body.error], [422, "sem conta"]);
  }
  assert.equal(f.tables.members.length, 0);
  assert.equal(f.tables.checkout_events.length, 0);
  noPii();
});

test("externalId no payload tem prioridade sobre e-mail + CPF", async () => {
  const f = fakeDb({ accounts: { [UID2]: "outro@exemplo.com" }, docAccounts: [{ email: "comprador@exemplo.com", hash: docHash(CPF, PEPPER), id: UID2 }] });
  const r = await handleCheckoutWebhook(req(officialV67({ externalId: UID })), env({ docPepper: PEPPER }), f.db);
  assert.deepEqual([r.status, r.body.action], [200, "activated"]);
  assert.ok(f.tables.members.some((m) => m.id === UID));
  assert.ok(!f.tables.members.some((m) => m.id === UID2));
});


// ---------- estorno do order bump (ALPHA Content Vault) não derruba o acesso ao principal ----------

const refundOf = (amount: unknown, over: Record<string, unknown> = {}) => payload({ status: "refunded", amount, ...over });

async function buyMainAndBump() {
  const f = fakeDb();
  const paid = await handleCheckoutWebhook(req(payload({ amount: 8594 })), env(), f.db); // principal 67,97 + bump 17,97
  assert.deepEqual([paid.status, paid.body.action], [200, "activated"]);
  return f;
}

test("estorno só do bump (R$ 17,97): mantém o acesso e não grava marca de estorno", async () => {
  const f = await buyMainAndBump();
  const r = await handleCheckoutWebhook(req(refundOf(1797)), env(), f.db);
  assert.deepEqual([r.status, r.body.action, r.body.reason], [200, "ignored", "bump"]);
  assert.equal(f.tables.members[0].access_status, "active");
  assert.ok(!f.tables.checkout_events.some((e) => e.id === "txn-1:revoked"));
  // reenvio do mesmo estorno e valor em texto: igual, sem efeito
  for (const amount of [1797, "1797"]) {
    const again = await handleCheckoutWebhook(req(refundOf(amount)), env(), f.db);
    assert.equal(again.body.reason, "bump");
  }
  assert.equal(f.tables.members[0].access_status, "active");
});

test("estorno do produto principal (R$ 67,97): bloqueia a conta", async () => {
  const f = await buyMainAndBump();
  const r = await handleCheckoutWebhook(req(refundOf(6797)), env(), f.db);
  assert.deepEqual([r.status, r.body.action], [200, "blocked"]);
  assert.equal(f.tables.members[0].access_status, "blocked");
});

test("estorno total (R$ 85,94): bloqueia a conta", async () => {
  const f = await buyMainAndBump();
  const r = await handleCheckoutWebhook(req(refundOf(8594)), env(), f.db);
  assert.deepEqual([r.status, r.body.action], [200, "blocked"]);
  assert.equal(f.tables.members[0].access_status, "blocked");
});

test("estorno do bump e depois do principal na mesma venda: o segundo bloqueia", async () => {
  const f = await buyMainAndBump();
  await handleCheckoutWebhook(req(refundOf(1797)), env(), f.db);
  assert.equal(f.tables.members[0].access_status, "active");
  const r = await handleCheckoutWebhook(req(refundOf(6797)), env(), f.db);
  assert.deepEqual([r.status, r.body.action], [200, "blocked"]);
  assert.equal(f.tables.members[0].access_status, "blocked");
});

test("estorno sem valor legível, ou chargedback do total: bloqueia (na dúvida, como sempre)", async () => {
  for (const amount of [undefined, null, "", "R$ 17,97", 17.97, 0]) {
    const f = await buyMainAndBump();
    const r = await handleCheckoutWebhook(req(refundOf(amount)), env(), f.db);
    assert.equal(r.body.action, "blocked", String(amount));
  }
  const f = await buyMainAndBump();
  assert.equal((await handleCheckoutWebhook(req(refundOf(8594, { status: "chargedback" })), env(), f.db)).body.action, "blocked");
});

test("estorno do bump no payload oficial (ESTORNADO, e-mail + CPF): acesso mantido", async () => {
  const f = fakeDb({ accounts: { [UID2]: "comprador@exemplo.com" }, docAccounts: [{ email: "comprador@exemplo.com", hash: docHash(CPF, PEPPER), id: UID2 }] });
  await handleCheckoutWebhook(req(officialV67({ amount: 8594 })), env({ docPepper: PEPPER }), f.db);
  const r = await handleCheckoutWebhook(req(officialV67({ status: "ESTORNADO", amount: 1797, customerDocument: undefined })), env({ docPepper: PEPPER }), f.db);
  assert.deepEqual([r.status, r.body.reason], [200, "bump"]);
  assert.equal(f.tables.members.find((m) => m.id === UID2)?.access_status, "active");
});
