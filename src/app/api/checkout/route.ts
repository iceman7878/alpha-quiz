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

  if (REVOKED.test(status)) {
    await db.from("members").update({ active: false }).eq("email", email);
    return NextResponse.json({ ok: true, action: "revoked" });
  }
  if (!APPROVED.test(status)) return NextResponse.json({ ok: true, action: "ignored", status });

  // Rota: primeiro pelo sck do checkout; senão, pelo lead do quiz (e-mail ou WhatsApp).
  let r = sck.split("-")[1] || "";
  if (!decodeAnswers(r)) {
    const byEmail = await db.from("leads").select("r").eq("email", email).order("created_at", { ascending: false }).limit(1);
    r = byEmail.data?.[0]?.r || "";
    if (!decodeAnswers(r) && whatsapp) {
      const byPhone = await db.from("leads").select("r").like("whatsapp", `%${whatsapp.slice(-8)}`).order("created_at", { ascending: false }).limit(1);
      r = byPhone.data?.[0]?.r || "";
    }
  }
  const answers = decodeAnswers(r);

  const { error } = await db.from("members").upsert(
    {
      email,
      nome: nome || null,
      whatsapp: whatsapp || null,
      r: answers ? r : null,
      rota: answers ? scoreAnswers(answers) : null,
      active: true,
    },
    { onConflict: "email" },
  );
  if (error) return NextResponse.json({ ok: false, error: "db" }, { status: 500 });

  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const invite = await db.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${site}/definir-senha`,
    data: { nome },
  });
  // Já cadastrado (compra repetida, reativação): segue sem novo convite — ele entra ou recupera a senha.
  const already = invite.error && /already|registered|exists/i.test(invite.error.message);
  if (invite.error && !already) return NextResponse.json({ ok: false, error: "invite" }, { status: 500 });

  return NextResponse.json({ ok: true, action: already ? "reactivated" : "invited" });
}
