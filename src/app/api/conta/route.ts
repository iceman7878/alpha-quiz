// Criação de conta antes do checkout (sem e-mail de confirmação: não há SMTP). A conta sozinha não dá acesso:
// o acesso só é liberado pelo webhook, para a conta cujo id veio no `externalId` do checkout (ver checkout-webhook.ts).
// Sem externalId no webhook, a venda é ligada à conta por e-mail + CPF/CNPJ (HMAC em app_metadata.doc_hash, ver
// lib/account-doc.ts). Quem cria uma conta só com o e-mail de outra pessoa não ganha nada: sem o documento dela, não liga.

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { docDigits, docHash, validDoc } from "@/lib/account-doc";

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
  const doc = docDigits(body.documento);
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 72) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
  }
  if (!validDoc(doc)) return NextResponse.json({ ok: false, error: "documento" }, { status: 422 });
  const pepper = process.env.ACCOUNT_DOC_PEPPER || "";
  const db = supabaseAdmin();
  if (!db || !pepper) {
    if (!pepper) console.error("[conta] sem ACCOUNT_DOC_PEPPER");
    return NextResponse.json({ ok: false, error: "indisponível" }, { status: 503 });
  }
  const { error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: nome ? { nome } : {},
    app_metadata: { doc_hash: docHash(doc, pepper) },
  });
  if (error) {
    if (/already|registered|exists/i.test(error.message)) return NextResponse.json({ ok: false, error: "exists" }, { status: 409 });
    console.error("[conta] supabase:", error.message);
    return NextResponse.json({ ok: false, error: "db" }, { status: 502 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
