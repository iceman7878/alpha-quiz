// Recebe o lead do quiz (antes do resultado): grava na tabela `leads` do Supabase e,
// se LEAD_WEBHOOK_URL estiver definido, repassa também (Make, Zapier, ManyChat…).

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

type Lead = {
  nome: string;
  whatsapp: string;
  email?: string;
  perfil?: string;
  r?: string;
  utm?: Record<string, string>;
  consentimento: boolean;
};

const clean = (v: unknown, max = 120) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "json" }, { status: 400 });
  }

  const whatsapp = clean(body.whatsapp, 20).replace(/\D/g, "");
  const lead: Lead = {
    nome: clean(body.nome, 60),
    whatsapp,
    email: clean(body.email) || undefined,
    perfil: clean(body.perfil, 20) || undefined,
    r: clean(body.r, 20) || undefined,
    utm: typeof body.utm === "object" && body.utm
      ? Object.fromEntries(
          Object.entries(body.utm as Record<string, unknown>)
            .filter(([, val]) => typeof val === "string")
            .slice(0, 10)
            .map(([k, val]) => [k.slice(0, 30), (val as string).slice(0, 200)]),
        )
      : undefined,
    consentimento: body.consentimento === true,
  };

  if (!lead.nome || !/^55\d{10,11}$/.test(whatsapp) || !lead.consentimento) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
  }

  const db = supabaseAdmin();
  let saved = false;
  if (db) {
    const { error } = await db.from("leads").insert({ ...lead, email: lead.email?.toLowerCase() ?? null });
    saved = !error;
    if (error) console.error("[lead] supabase:", error.message);
  }

  const target = process.env.LEAD_WEBHOOK_URL;
  let forwarded = false;
  if (target) {
    try {
      const res = await fetch(target, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...lead, origem: "quiz", ts: new Date().toISOString() }),
        signal: AbortSignal.timeout(5000),
      });
      forwarded = res.ok;
    } catch {}
  }

  if (!db && !target) console.log("[lead] sem destino configurado:", JSON.stringify(lead));
  return NextResponse.json({ ok: saved || forwarded || (!db && !target), saved, forwarded });
}
