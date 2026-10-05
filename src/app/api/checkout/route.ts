// Webhook do checkout: compra aprovada → cria/ativa o membro e envia o convite de acesso.
// Reembolso/chargeback/cancelamento → bloqueia. URL a cadastrar na plataforma:
//   https://<dominio>/api/checkout?token=<CHECKOUT_WEBHOOK_SECRET>
//
// A plataforma ainda não foi definida. Por isso o webhook FICA FECHADO (503) até existirem:
//   CHECKOUT_WEBHOOK_SECRET     token na URL (ou header x-webhook-token)
//   CHECKOUT_SIGNATURE_SECRET   segredo de assinatura do provider
//   CHECKOUT_SIGNATURE_HEADER   header onde o provider manda a assinatura (HMAC do corpo bruto)
//   CHECKOUT_SIGNATURE_ALGO     sha256 (padrão) ou sha1
//   CHECKOUT_PRODUCT_IDS        ids/códigos do produto ALPHA LAUNCH aceitos, separados por vírgula
// Nenhum "approved" genérico libera acesso: precisa de token + assinatura válida + produto da lista
// + status reconhecido + id de transação. Cada (transação, tipo de evento) é processado uma vez
// (tabela checkout_events). Ao escolher a plataforma: conferir o formato da assinatura dela
// (alguns providers assinam com timestamp ou não usam HMAC) e ajustar `validSignature`/`normalize`
// com um evento de teste real antes de ir ao ar.

import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { decodeAnswers, scoreAnswers } from "@/lib/quiz";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { APPROVED, REVOKED, normalize } from "@/lib/checkout";

export const runtime = "nodejs";

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

function validToken(req: Request): boolean {
  const expected = process.env.CHECKOUT_WEBHOOK_SECRET || "";
  const got = new URL(req.url).searchParams.get("token") || req.headers.get("x-webhook-token") || "";
  return !!expected && safeEqual(got, expected);
}

/** HMAC do corpo bruto. Aceita hex ou base64, com ou sem prefixo "sha256=". */
function validSignature(req: Request, raw: string): boolean {
  const secret = process.env.CHECKOUT_SIGNATURE_SECRET || "";
  const header = process.env.CHECKOUT_SIGNATURE_HEADER || "";
  const algo = process.env.CHECKOUT_SIGNATURE_ALGO === "sha1" ? "sha1" : "sha256";
  const got = (req.headers.get(header) || "").trim().replace(/^sha(1|256)=/i, "");
  if (!secret || !header || !got) return false;
  const mac = createHmac(algo, secret).update(raw, "utf8").digest();
  return safeEqual(got.toLowerCase(), mac.toString("hex")) || safeEqual(got, mac.toString("base64"));
}

const allowedProducts = () =>
  (process.env.CHECKOUT_PRODUCT_IDS || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

const configured = () =>
  !!process.env.CHECKOUT_WEBHOOK_SECRET &&
  !!process.env.CHECKOUT_SIGNATURE_SECRET &&
  !!process.env.CHECKOUT_SIGNATURE_HEADER &&
  allowedProducts().length > 0;

export async function POST(req: Request) {
  if (!configured()) return NextResponse.json({ ok: false, error: "webhook não configurado" }, { status: 503 });
  if (!validToken(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const raw = await req.text();
  if (!validSignature(req, raw)) return NextResponse.json({ ok: false, error: "assinatura" }, { status: 401 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "json" }, { status: 400 });
  }

  const { email, nome, whatsapp, status, sck, txn, products } = normalize(body);
  const allowed = allowedProducts();
  // Produto de outra oferta (ou sem produto): não é deste funil. 200 para o provider não reenviar.
  if (!products.some((p) => allowed.includes(p))) return NextResponse.json({ ok: true, action: "ignored", reason: "produto" });

  const kind = REVOKED.test(status) ? "revoked" : APPROVED.test(status) ? "approved" : null;
  if (!kind) return NextResponse.json({ ok: true, action: "ignored", status });
  if (!txn) return NextResponse.json({ ok: false, error: "sem transação" }, { status: 422 });
  if (!email) return NextResponse.json({ ok: false, error: "sem e-mail" }, { status: 422 });

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "supabase não configurado" }, { status: 500 });

  // Idempotência: o mesmo evento chega mais de uma vez (providers reenviam).
  const eventId = `${txn}:${kind}`;
  const claim = await db.from("checkout_events").insert({ id: eventId, txn, kind, status, email });
  if (claim.error) {
    if (claim.error.code === "23505") return NextResponse.json({ ok: true, action: "duplicate" });
    return NextResponse.json({ ok: false, error: "db" }, { status: 500 });
  }
  // Falhou no meio: libera o evento para o reenvio do provider tentar de novo.
  const fail = async (error: string) => {
    await db.from("checkout_events").delete().eq("id", eventId);
    return NextResponse.json({ ok: false, error }, { status: 500 });
  };

  // Reembolso / chargeback / cancelamento → bloqueia (dados ficam guardados; recompra reativa).
  if (kind === "revoked") {
    const { error } = await db.from("members").update({ access_status: "blocked" }).eq("email", email);
    if (error) return fail("db");
    return NextResponse.json({ ok: true, action: "blocked" });
  }

  // 1) Usuário do Auth: convite para quem é novo; id existente para recompra.
  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const invite = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${site}/definir-senha`,
    data: { nome },
  });
  let userId = invite.data?.user?.id ?? null;
  const already = !!invite.error && /already|registered|exists/i.test(invite.error.message);
  if (invite.error && !already) return fail("invite");
  if (!userId) {
    const { data } = await db.rpc("user_id_by_email", { p_email: email });
    userId = (data as string | null) ?? null;
  }
  if (!userId) return fail("user");

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
  if (error) return fail("db");

  return NextResponse.json({ ok: true, action: already ? "reactivated" : "invited" });
}
