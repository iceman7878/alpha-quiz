// Webhook do checkout (Disrupty): `paid` → cria/ativa o membro e envia o convite de acesso;
// `refunded`/`chargedback` → bloqueia. Pendentes e recusados não mudam nada.
// URL a cadastrar no painel da Disrupty:
//   https://<dominio>/api/checkout?token=<CHECKOUT_WEBHOOK_SECRET>
//
// FICA FECHADO (503) até existirem:
//   CHECKOUT_WEBHOOK_SECRET     token na URL (ou header x-webhook-token) — obrigatório, mín. 32 caracteres
//   CHECKOUT_PRODUCT_IDS        id(s)/código(s) do produto ALPHA LAUNCH na Disrupty, separados por vírgula
// Opcional (só se a Disrupty assinar o corpo; não confirmado na documentação):
//   CHECKOUT_SIGNATURE_SECRET + CHECKOUT_SIGNATURE_HEADER (+ CHECKOUT_SIGNATURE_ALGO sha256|sha1)
//   Com os dois definidos, a assinatura passa a ser exigida. Só um dos dois = configuração inválida (503).
//
// Cada (transação, tipo) é processado uma vez (tabela checkout_events). No `paid`, falha no meio desfaz a marca
// e responde 500, para o reenvio da Disrupty (até 5x) tentar de novo. Reenvio que encontra a marca sem o
// efeito pronto (outra entrega ainda processando ou falhou) recebe 409, para tentar de novo.
// O `paid` grava na sua marca a conta liberada (user_id); o estorno bloqueia ESSA conta, achada pela transação.
// Estorno de transação sem compra registrada não bloqueia ninguém (só barra um `paid` atrasado).
// Lógica separada da rota para ser testada sem Next nem Supabase (tests/checkout-webhook.test.ts).

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { kindOf, normalize, payloadKeys } from "./checkout";
import { decodeAnswers, scoreAnswers } from "./quiz";

export type WebhookEnv = {
  token: string;
  productIds: string[];
  signatureSecret: string;
  signatureHeader: string;
  signatureAlgo: "sha1" | "sha256";
  siteUrl: string;
};

export function webhookEnv(e: Record<string, string | undefined> = process.env): WebhookEnv {
  return {
    token: e.CHECKOUT_WEBHOOK_SECRET || "",
    productIds: (e.CHECKOUT_PRODUCT_IDS || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
    signatureSecret: e.CHECKOUT_SIGNATURE_SECRET || "",
    signatureHeader: e.CHECKOUT_SIGNATURE_HEADER || "",
    signatureAlgo: e.CHECKOUT_SIGNATURE_ALGO === "sha1" ? "sha1" : "sha256",
    siteUrl: e.NEXT_PUBLIC_SITE_URL || "",
  };
}

export type WebhookResult = { status: number; body: Record<string, unknown> };
const res = (status: number, body: Record<string, unknown>): WebhookResult => ({ status, body });

/** Compara os hashes: tempo constante também quando os tamanhos diferem. */
function safeEqual(a: string, b: string): boolean {
  const h = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(h(a), h(b));
}

const MIN_TOKEN = 32;

/** Motivo para o webhook ficar fechado (só vai para o log, nunca para a resposta). */
function configProblem(env: WebhookEnv): string | null {
  if (!env.token || env.productIds.length === 0) return "sem CHECKOUT_WEBHOOK_SECRET ou CHECKOUT_PRODUCT_IDS";
  if (env.token.length < MIN_TOKEN) return `CHECKOUT_WEBHOOK_SECRET com menos de ${MIN_TOKEN} caracteres`;
  if (!env.signatureSecret !== !env.signatureHeader) return "assinatura pela metade: defina CHECKOUT_SIGNATURE_SECRET e CHECKOUT_SIGNATURE_HEADER juntos";
  return null;
}

function validToken(req: Request, env: WebhookEnv): boolean {
  const got = new URL(req.url).searchParams.get("token") || req.headers.get("x-webhook-token") || "";
  return !!got && safeEqual(got, env.token);
}

/** HMAC do corpo bruto. Aceita hex ou base64, com ou sem prefixo "sha256=". */
function validSignature(req: Request, raw: string, env: WebhookEnv): boolean {
  const got = (req.headers.get(env.signatureHeader) || "").trim().replace(/^sha(1|256)=/i, "");
  if (!got) return false;
  const mac = createHmac(env.signatureAlgo, env.signatureSecret).update(raw, "utf8").digest();
  return safeEqual(got.toLowerCase(), mac.toString("hex")) || safeEqual(got, mac.toString("base64"));
}

/** Outra compra paga, já ligada a esta conta e não reembolsada. null = erro de banco. */
async function otherPaidTxn(db: SupabaseClient, userId: string, txn: string): Promise<boolean | null> {
  const paid = await db.from("checkout_events").select("txn").eq("kind", "approved").eq("user_id", userId);
  if (paid.error) return null;
  const others = ((paid.data ?? []) as { txn: string }[]).map((r) => r.txn).filter((t) => t !== txn);
  if (!others.length) return false;
  const rev = await db.from("checkout_events").select("txn").eq("kind", "revoked").in("txn", others);
  if (rev.error) return null;
  const revoked = new Set(((rev.data ?? []) as { txn: string }[]).map((r) => r.txn));
  return others.some((t) => !revoked.has(t));
}

/**
 * Desfaz o acesso que ESTA transação deu. A conta vem do registro do `paid` (gravada na liberação),
 * nunca do e-mail do evento de estorno, que pode vir diferente, vazio ou ambíguo.
 * "sem compra" = esta transação não liberou ninguém (ainda): nada a bloquear. null = erro de banco.
 */
async function revokeTxn(db: SupabaseClient, txn: string): Promise<"blocked" | "kept" | "sem compra" | null> {
  const { data, error } = await db.from("checkout_events").select("user_id").eq("id", `${txn}:approved`).maybeSingle();
  if (error) return null;
  const userId = (data as { user_id?: string | null } | null)?.user_id;
  if (!userId) return "sem compra";
  const other = await otherPaidTxn(db, userId, txn);
  if (other === null) return null;
  if (other) return "kept";
  const blocked = await db.from("members").update({ access_status: "blocked" }).eq("id", userId);
  return blocked.error ? null : "blocked";
}

/** Acesso da compra já ativo? (para responder 200 a um reenvio do `paid` com segurança) */
async function memberActive(db: SupabaseClient, email: string): Promise<boolean> {
  const { data, error } = await db.from("members").select("access_status").eq("email", email).maybeSingle();
  return !error && (data as { access_status?: string } | null)?.access_status === "active";
}

export async function handleCheckoutWebhook(req: Request, env: WebhookEnv, db: SupabaseClient | null): Promise<WebhookResult> {
  const problem = configProblem(env);
  if (problem) {
    console.error("[checkout] fechado:", problem);
    return res(503, { ok: false, error: "webhook não configurado" });
  }
  if (!validToken(req, env)) return res(401, { ok: false });

  const raw = await req.text();
  if (env.signatureSecret && !validSignature(req, raw, env)) return res(401, { ok: false, error: "assinatura" });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return res(400, { ok: false, error: "json" });
  }
  if (!body || typeof body !== "object") return res(400, { ok: false, error: "json" });

  const { email, nome, whatsapp, status, ambiguous, sck, txn, products } = normalize(body);

  // Produto de outra oferta (ou sem produto reconhecido): não é deste funil. 200 para não haver reenvio.
  if (!products.some((p) => env.productIds.includes(p))) {
    console.warn("[checkout] ignorado (produto)", { status, products, keys: payloadKeys(body) });
    return res(200, { ok: true, action: "ignored", reason: "produto" });
  }

  // Dois status conhecidos diferentes no mesmo payload: não adivinha. 422 deixa a falha visível no painel da Disrupty.
  if (ambiguous.length) {
    console.error("[checkout] status ambíguo", { statuses: ambiguous, txn, keys: payloadKeys(body) });
    return res(422, { ok: false, error: "status ambíguo" });
  }

  // Pendente, autorizado, recusado ou desconhecido: nada muda.
  const kind = kindOf(status);
  if (!kind) {
    console.info("[checkout] ignorado (status)", { status, txn, keys: status ? undefined : payloadKeys(body) });
    return res(200, { ok: true, action: "ignored", status });
  }
  // O estorno é ligado à compra pela transação; o e-mail só é exigido para liberar.
  if (!txn || (kind === "approved" && !email)) {
    console.error("[checkout] payload sem", !txn ? "transação" : "e-mail do comprador (ausente ou mais de um)", { status, keys: payloadKeys(body) });
    return res(422, { ok: false, error: !txn ? "sem transação" : "sem e-mail" });
  }

  if (!db) return res(500, { ok: false, error: "supabase não configurado" });
  const eventId = `${txn}:${kind}`;

  // Reembolso / chargeback → bloqueia a conta que ESTA transação liberou (dados ficam guardados; nova compra reativa).
  // A marca vem antes da consulta da compra: um `paid` desta transação que chegue depois (ou ao mesmo tempo) a encontra.
  // Se a conta tem outra compra paga e não reembolsada (ex.: pagou duas vezes e estornou uma), o acesso continua.
  // Reenvio refaz o efeito (idempotente); em erro a marca fica, para o `paid` atrasado continuar barrado.
  if (kind === "revoked") {
    const mark = await db.from("checkout_events").insert({ id: eventId, txn, kind, status, email: email || null });
    if (mark.error && mark.error.code !== "23505") {
      console.error("[checkout] checkout_events:", mark.error.message);
      return res(500, { ok: false, error: "db" });
    }
    const out = await revokeTxn(db, txn);
    if (!out) {
      console.error("[checkout] falha ao aplicar estorno; aguardando reenvio", { txn });
      return res(500, { ok: false, error: "db" });
    }
    if (out === "sem compra") {
      // Estorno antes do paid, paid que nunca liberou, ou id diferente entre paid e estorno (conferir no 1º estorno real).
      console.error("[checkout] estorno sem compra registrada nesta transação; nada bloqueado", { txn, keys: payloadKeys(body) });
      return res(200, { ok: true, action: "ignored", reason: "sem compra" });
    }
    return res(200, { ok: true, action: mark.error ? "duplicate" : out });
  }

  // Reembolso já registrado para esta transação: um `paid` atrasado (reenvio) não reativa, e garante o bloqueio.
  const revokedMark = async () => db.from("checkout_events").select("id").eq("id", `${txn}:revoked`).maybeSingle();
  const refunded = await revokedMark();
  if (refunded.error) {
    console.error("[checkout] checkout_events:", refunded.error.message);
    return res(500, { ok: false, error: "db" });
  }
  if (refunded.data) {
    if (!(await revokeTxn(db, txn))) return res(500, { ok: false, error: "db" });
    return res(200, { ok: true, action: "ignored", reason: "já reembolsada" });
  }

  // Idempotência: a Disrupty reenvia o mesmo evento. Marca existente só vira 200 se o acesso já estiver ativo;
  // senão outra entrega ainda está processando (ou falhou sem desfazer a marca) e o reenvio precisa continuar.
  const claim = await db.from("checkout_events").insert({ id: eventId, txn, kind, status, email });
  if (claim.error) {
    if (claim.error.code === "23505") {
      if (await memberActive(db, email)) return res(200, { ok: true, action: "duplicate" });
      console.warn("[checkout] marca sem efeito ainda; pedindo reenvio", { txn, kind });
      return res(409, { ok: false, error: "em processamento" });
    }
    console.error("[checkout] checkout_events:", claim.error.message);
    return res(500, { ok: false, error: "db" });
  }
  const fail = async (error: string, detail?: string) => {
    console.error("[checkout] falha", { error, detail, txn, kind });
    await db.from("checkout_events").delete().eq("id", eventId);
    return res(500, { ok: false, error });
  };

  // 1) Usuário do Auth: convite (e-mail com link para /definir-senha) para quem é novo; id existente para quem já tem conta.
  const site = env.siteUrl || new URL(req.url).origin;
  const invite = await db.auth.admin.inviteUserByEmail(email, { redirectTo: `${site}/definir-senha`, data: { nome } });
  let userId = invite.data?.user?.id ?? null;
  const already = !!invite.error && /already|registered|exists/i.test(invite.error.message);
  if (invite.error && !already) return fail("invite", invite.error.message);
  if (!userId) {
    const { data } = await db.rpc("user_id_by_email", { p_email: email });
    userId = (data as string | null) ?? null;
  }
  if (!userId) return fail("user");
  // Liga a transação à conta ANTES de liberar: é por esse vínculo que o estorno acha quem bloquear.
  const link = await db.from("checkout_events").update({ user_id: userId }).eq("id", eventId);
  if (link.error) return fail("db", link.error.message);

  // 2) Rota: primeiro pelo sck do checkout; senão, pelo lead do quiz (e-mail ou WhatsApp).
  let r = sck.split("-")[1] || "";
  if (!decodeAnswers(r)) {
    const byEmail = await db.from("leads").select("r").eq("email", email).order("created_at", { ascending: false }).limit(1);
    r = byEmail.data?.[0]?.r || "";
    if (!decodeAnswers(r) && whatsapp.length >= 8) {
      const byPhone = await db.from("leads").select("r").like("whatsapp", `%${whatsapp.slice(-8)}`).order("created_at", { ascending: false }).limit(1);
      r = byPhone.data?.[0]?.r || "";
    }
  }
  const answers = decodeAnswers(r);

  // 3) Membro ativo. Na recompra, só sobrescreve o que veio preenchido.
  const row: Record<string, unknown> = { id: userId, email, access_status: "active" };
  if (nome) row.nome = nome;
  if (whatsapp) row.whatsapp = whatsapp;
  if (answers) {
    row.r = r;
    row.route = scoreAnswers(answers);
  }
  const { error } = await db.from("members").upsert(row, { onConflict: "id" });
  if (error) return fail("db", error.message);

  // Estorno que chegou enquanto esta entrega processava: desfaz. Erro aqui → 500 sem apagar a marca; o reenvio
  // cai na trava do estorno (que bloqueia) ou no duplicado.
  const late = await revokedMark();
  if (late.error) {
    console.error("[checkout] checkout_events:", late.error.message);
    return res(500, { ok: false, error: "db" });
  }
  if (late.data) {
    if (!(await revokeTxn(db, txn))) return res(500, { ok: false, error: "db" });
    return res(200, { ok: true, action: "ignored", reason: "já reembolsada" });
  }

  return res(200, { ok: true, action: already ? "reactivated" : "invited" });
}
