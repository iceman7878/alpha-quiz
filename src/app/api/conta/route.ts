// Criação de conta antes do checkout (sem e-mail de confirmação: não há SMTP). A conta sozinha não dá acesso:
// o acesso só é liberado pelo webhook, para a conta cujo id veio no `externalId` do checkout (ver checkout-webhook.ts).
// Quem cria uma conta com o e-mail de outra pessoa não ganha nada: a compra dela nunca é ligada a essa conta.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "json" }, { status: 400 });
  }
  if (body.empresa) return NextResponse.json({ ok: true }); // honeypot
  const email = String(body.email ?? "").trim().toLowerCase().slice(0, 254);
  const password = String(body.password ?? "");
  const nome = String(body.nome ?? "").trim().slice(0, 60);
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 72) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
  }
  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ ok: false, error: "indisponível" }, { status: 503 });
  const { error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: nome ? { nome } : {} });
  if (error) {
    if (/already|registered|exists/i.test(error.message)) return NextResponse.json({ ok: false, error: "exists" }, { status: 409 });
    console.error("[conta] supabase:", error.message);
    return NextResponse.json({ ok: false, error: "db" }, { status: 502 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
