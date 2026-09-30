// Recebe o lead do quiz (antes do resultado) e repassa para um webhook externo
// (ManyChat, Make, Zapier, planilha…) definido em LEAD_WEBHOOK_URL.

import { NextResponse } from "next/server";

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
    utm: typeof body.utm === "object" && body.utm ? (body.utm as Record<string, string>) : undefined,
    consentimento: body.consentimento === true,
  };

  if (!lead.nome || !/^55\d{10,11}$/.test(whatsapp) || !lead.consentimento) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 422 });
  }

  const target = process.env.LEAD_WEBHOOK_URL;
  if (!target) {
    console.log("[lead] LEAD_WEBHOOK_URL não definido:", JSON.stringify(lead));
    return NextResponse.json({ ok: true, forwarded: false });
  }

  try {
    const res = await fetch(target, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...lead, origem: "quiz", ts: new Date().toISOString() }),
      signal: AbortSignal.timeout(5000),
    });
    return NextResponse.json({ ok: res.ok, forwarded: true }, { status: res.ok ? 200 : 502 });
  } catch {
    return NextResponse.json({ ok: false, forwarded: false }, { status: 502 });
  }
}
