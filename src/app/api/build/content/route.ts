// Entrega o conteúdo dos 7 dias SÓ para sessão válida + access_status = active.
// Em modo demonstração (dev ou NEXT_PUBLIC_DEMO=1, sem Supabase) entrega sem login.

import { NextResponse } from "next/server";
import { DAY01_EXAMPLES, DAYS } from "@/lib/build-content";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const demoAllowed = () =>
  !process.env.NEXT_PUBLIC_SUPABASE_URL &&
  (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEMO === "1");

const noStore = { "cache-control": "private, no-store" };

export async function GET(req: Request) {
  if (!demoAllowed()) {
    const db = supabaseAdmin();
    if (!db) return NextResponse.json({ error: "config" }, { status: 503, headers: noStore });

    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return NextResponse.json({ error: "auth" }, { status: 401, headers: noStore });

    const { data: u, error } = await db.auth.getUser(token);
    if (error || !u.user) return NextResponse.json({ error: "auth" }, { status: 401, headers: noStore });

    const { data: member } = await db.from("members").select("access_status").eq("id", u.user.id).maybeSingle();
    if (member?.access_status !== "active") {
      return NextResponse.json({ error: "access" }, { status: 403, headers: noStore });
    }
  }

  return NextResponse.json({ days: DAYS, day01Examples: DAY01_EXAMPLES }, { headers: noStore });
}
