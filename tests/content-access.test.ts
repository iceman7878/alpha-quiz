// Acesso ao conteúdo pago (/api/build/content) com um Supabase falso: nada de rede, nada de banco real.
// Rodar: npx tsx --test tests/*.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import { contentDenied, demoAllowed, type ContentEnv } from "../src/lib/content-access";

const FULL: ContentEnv = { nodeEnv: "production", supabaseUrl: "https://x.supabase.co", anonKey: "anon", serviceKey: "service" };

function fakeDb(members: Record<string, string>, { sessions = { "tok-ana": "user-ana" } as Record<string, string>, failMembers = false } = {}) {
  return {
    auth: {
      async getUser(token: string) {
        const id = sessions[token];
        return id ? { data: { user: { id } }, error: null } : { data: { user: null }, error: { message: "invalid JWT" } };
      },
    },
    from(t: string) {
      assert.equal(t, "members");
      return {
        select: () => ({
          eq: (_c: string, id: string) => ({
            maybeSingle: async () =>
              failMembers ? { data: null, error: { message: "db fora" } } : { data: id in members ? { access_status: members[id] } : null, error: null },
          }),
        }),
      };
    },
  } as unknown as SupabaseClient;
}

const req = (token?: string) => new Request("https://alpha.test/api/build/content", { headers: token ? { authorization: `Bearer ${token}` } : {} });

test("build de produção sem Supabase não abre o conteúdo, mesmo com NEXT_PUBLIC_DEMO=1 no ambiente", async () => {
  const before = process.env.NEXT_PUBLIC_DEMO;
  process.env.NEXT_PUBLIC_DEMO = "1";
  try {
    assert.equal(demoAllowed({ nodeEnv: "production" }), false);
    assert.deepEqual(await contentDenied(req(), { nodeEnv: "production" }, null), { status: 503, error: "config" });
  } finally {
    if (before === undefined) delete process.env.NEXT_PUBLIC_DEMO;
    else process.env.NEXT_PUBLIC_DEMO = before;
  }
});

test("NODE_ENV ausente, test ou desconhecido: fechado", async () => {
  for (const nodeEnv of [undefined, "test", "staging", ""]) {
    assert.equal(demoAllowed({ nodeEnv }), false, String(nodeEnv));
    assert.equal((await contentDenied(req(), { nodeEnv }, null))?.status, 503);
  }
});

test("configuração incompleta do Supabase: fechado em produção e também em dev", async () => {
  const partial: ContentEnv[] = [{ supabaseUrl: "https://x.supabase.co" }, { anonKey: "anon" }, { serviceKey: "service" }, { supabaseUrl: "https://x.supabase.co", anonKey: "anon" }];
  for (const nodeEnv of ["production", "development"]) {
    for (const p of partial) {
      const e = { nodeEnv, ...p };
      assert.equal(demoAllowed(e), false, JSON.stringify(e));
      // Sem URL + chave de serviço não há cliente admin (supabaseAdmin() devolve null).
      assert.deepEqual(await contentDenied(req("tok-ana"), e, null), { status: 503, error: "config" }, JSON.stringify(e));
    }
  }
});

test("demonstração local: só em next dev sem nenhuma credencial", async () => {
  assert.equal(demoAllowed({ nodeEnv: "development" }), true);
  assert.equal(await contentDenied(req(), { nodeEnv: "development" }, null), null);
});

test("Supabase completo: sem token, token inválido, sem membro, bloqueado ou erro de banco → negado", async () => {
  const db = fakeDb({ "user-ana": "blocked", "user-bia": "active" }, { sessions: { "tok-ana": "user-ana", "tok-bia": "user-bia", "tok-cid": "user-cid" } });
  assert.deepEqual(await contentDenied(req(), FULL, db), { status: 401, error: "auth" });
  assert.deepEqual(await contentDenied(req("forjado"), FULL, db), { status: 401, error: "auth" });
  assert.deepEqual(await contentDenied(req("tok-cid"), FULL, db), { status: 403, error: "access" });
  assert.deepEqual(await contentDenied(req("tok-ana"), FULL, db), { status: 403, error: "access" });
  assert.deepEqual(await contentDenied(req("tok-ana"), FULL, fakeDb({ "user-ana": "active" }, { failMembers: true })), { status: 403, error: "access" });
});

test("Supabase completo e membro ativo: libera; em dev com Supabase também exige login", async () => {
  const db = fakeDb({ "user-ana": "active" });
  assert.equal(await contentDenied(req("tok-ana"), FULL, db), null);
  const dev = { ...FULL, nodeEnv: "development" };
  assert.deepEqual(await contentDenied(req(), dev, db), { status: 401, error: "auth" });
  assert.equal(await contentDenied(req("tok-ana"), dev, db), null);
});
