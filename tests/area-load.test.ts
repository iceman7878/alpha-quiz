// Guarda da área de membros (src/lib/store.ts) com um Supabase falso: falha de leitura nunca vira
// "sem compra" nem progresso vazio (F06/F09, 17/11/2026). Rodar: npx tsx --test tests/*.test.ts

import { test, before, beforeEach } from "node:test";
import assert from "node:assert/strict";

type Store = typeof import("../src/lib/store");
let store: Store;

// O módulo decide o modo na importação: com URL + anon key ele roda em modo "supabase".
before(async () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-de-teste";
  store = await import("../src/lib/store");
});

type Opts = {
  session?: boolean;
  user?: { id: string } | null;
  authError?: { status?: number; message: string } | null;
  member?: Record<string, unknown> | null;
  memberError?: boolean;
  progress?: Record<string, unknown>[];
  progressError?: boolean;
  content?: number | "network";
};

function setup(o: Opts = {}) {
  const client = {
    auth: {
      getSession: async () => ({ data: { session: o.session === false ? null : { user: { email: "ana@exemplo.com" }, access_token: "tok" } } }),
      getUser: async () => ({ data: { user: o.user === undefined ? { id: "user-1" } : o.user }, error: o.authError ?? null }),
    },
    from(t: string) {
      if (t === "members") {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => (o.memberError ? { data: null, error: { message: "db fora" } } : { data: o.member === undefined ? { email: "ana@exemplo.com", nome: "Ana", route: "servico", access_status: "active", score: null, level: null, score_answers: null } : o.member, error: null }) }) }) };
      }
      assert.equal(t, "progress");
      return { select: async () => (o.progressError ? { data: null, error: { message: "db fora" } } : { data: o.progress ?? [], error: null }) };
    },
  };
  store.__useClientForTests(client as never);
  globalThis.fetch = (async () => {
    if (o.content === "network") throw new TypeError("fetch failed");
    const status = o.content ?? 200;
    return new Response(JSON.stringify(status === 200 ? { days: [], day01Examples: {} } : { error: "x" }), { status });
  }) as typeof fetch;
}

beforeEach(() => {
  console.error = () => {};
});

// ---------- regressão: o defeito original (estes falham no store.ts de 54662ad) ----------

test("F06: erro ao ler o progresso lança LoadError, não devolve progresso vazio", async () => {
  setup({ progressError: true });
  await assert.rejects(store.loadProgress(), store.LoadError);
});

test("F09: erro de banco ao ler o membro lança LoadError, não vira 'sem compra'", async () => {
  setup({ memberError: true });
  await assert.rejects(store.loadMember(), store.LoadError);
});

test("F09: conteúdo com 500/503 lança LoadError, não vira 'sem compra'", async () => {
  for (const content of [500, 503]) {
    setup({ content });
    await assert.rejects(store.loadContent(), store.LoadError, String(content));
  }
});

// ---------- loadArea: o que a área mostra ----------

test("loadArea: falhas de leitura (progresso, membro, conteúdo, rede, auth) viram 'error'", async () => {
  for (const o of [{ progressError: true }, { memberError: true }, { content: 503 }, { content: "network" as const }, { user: null, authError: { message: "fetch failed" } }]) {
    setup(o);
    assert.equal((await store.loadArea()).status, "error", JSON.stringify(o));
  }
});

test("loadArea: sem sessão → 'nosession'; sem membro, bloqueado, sessão inválida ou conteúdo 401/403 → 'noaccess'", async () => {
  setup({ session: false });
  assert.equal((await store.loadArea()).status, "nosession");
  for (const o of [{ member: null }, { member: { email: "a", nome: null, route: null, access_status: "blocked", score: null, level: null, score_answers: null } }, { user: null, authError: { status: 401, message: "invalid JWT" } }, { content: 401 }, { content: 403 }]) {
    setup(o);
    assert.equal((await store.loadArea()).status, "noaccess", JSON.stringify(o));
  }
});

test("loadArea: tudo certo → 'ready' com o progresso salvo", async () => {
  setup({ progress: [{ day: 1, answers: { a: "x" }, completed: true }] });
  const r = await store.loadArea();
  assert.equal(r.status, "ready");
  if (r.status === "ready") assert.deepEqual(r.progress, { 1: { answers: { a: "x" }, completed: true } });
});
