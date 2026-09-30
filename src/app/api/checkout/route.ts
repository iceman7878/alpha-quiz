// Webhook do checkout: compra aprovada → cria/ativa o membro e envia o convite de acesso por e-mail.
// Reembolso/chargeback → desativa. URL a cadastrar na plataforma:
//   https://<dominio>/api/checkout?token=<CHECKOUT_WEBHOOK_SECRET>
// A plataforma ainda não foi definida: `normalize` procura os campos nos formatos mais comuns.
// Ao escolher a plataforma, conferir com um evento de teste.

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { decodeAnswers, scoreAnswers } from "@/lib/quiz";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { APPROVED, REVOKED, normalize } from "@/lib/checkout";

export const runtime = "nodejs";

function validToken(req: Request): boolean {
  const expected = process.env.CHECKOUT_WEBHOOK_SECRET || "";
  const got = new URL(req.url).searchParams.get("token") || req.headers.get("x-webhook-token") || "";
  if (!expected || got.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

export async function POST(req: Request) {
  if (!validToken(req)) return NextResponse.json({ ok: false }, { status: 401 });

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "supabase não configurado" }, { status: 500 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "json" }, { status: 400 });
  }

  const { email, nome, whatsapp, status, sck } = normalize(body);
  if (!email) return NextResponse.json({ ok: false, error: "sem e-mail" }, { status: 422 });

  // Reembolso / chargeback / cancelamento → bloqueia (dados ficam guardados; recompra reativa).
  if (REVOKED.test(status)) {
    const { error } = await db.from("members").update({ access_status: "blocked" }).eq("email", email);
    if (error) return NextResponse.json({ ok: false, error: "db" }, { status: 500 });
    return NextResponse.json({ ok: true, action: "blocked" });
  }
  if (!APPROVED.test(status)) return NextResponse.json({ ok: true, action: "ignored", status });

  // 1) Usuário do Auth: convite para quem é novo; id existente para recompra.
  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const invite = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${site}/definir-senha`,
    data: { nome },
  });
  let userId = invite.data?.user?.id ?? null;
  const already = !!invite.error && /already|registered|exists/i.test(invite.error.message);
  if (invite.error && !already) return NextResponse.json({ ok: false, error: "invite" }, { status: 500 });
  if (!userId) {
    const { data } = await db.rpc("user_id_by_email", { p_email: email });
    userId = (data as string | null) ?? null;
  }
  if (!userId) return NextResponse.json({ ok: false, error: "user" }, { status: 500 });

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
  if (error) return NextResponse.json({ ok: false, error: "db" }, { status: 500 });

  return NextResponse.json({ ok: true, action: already ? "reactivated" : "invited" });
}
