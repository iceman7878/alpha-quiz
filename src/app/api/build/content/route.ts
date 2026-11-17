// Entrega o conteúdo dos 7 dias SÓ para sessão válida + access_status = active.
// Modo demonstração (sem login) só em `next dev` sem nenhuma credencial do Supabase (regras em lib/content-access).

import { NextResponse } from "next/server";
import { DAY01_EXAMPLES, DAYS } from "@/lib/build-content";
import { contentDenied } from "@/lib/content-access";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "private, no-store" };

export async function GET(req: Request) {
  // NODE_ENV escrito por extenso: o Next troca por constante no build ("production" em qualquer build de produção).
  const env = {
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
  const denied = await contentDenied(req, env, supabaseAdmin());
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status, headers: noStore });

  return NextResponse.json({ days: DAYS, day01Examples: DAY01_EXAMPLES }, { headers: noStore });
}
