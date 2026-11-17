// Webhook do checkout (Disrupty). As regras moram em src/lib/checkout-webhook.ts, testadas sem Next
// nem Supabase em tests/checkout-webhook.test.ts. URL a cadastrar no painel da Disrupty:
//   https://<dominio>/api/checkout?token=<CHECKOUT_WEBHOOK_SECRET>

import { NextResponse } from "next/server";
import { handleCheckoutWebhook, webhookEnv } from "@/lib/checkout-webhook";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { status, body } = await handleCheckoutWebhook(req, webhookEnv(), supabaseAdmin());
  return NextResponse.json(body, { status });
}
