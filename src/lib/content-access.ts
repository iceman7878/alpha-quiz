// Quem recebe o conteúdo dos 7 dias (/api/build/content). Fechado na dúvida: sem Supabase completo, nada sai.
// Lógica separada da rota para ser testada sem Next (tests/content-access.test.ts).
// Não importar build-content aqui: este arquivo também entra no navegador (store.ts usa demoAllowed).

import type { SupabaseClient } from "@supabase/supabase-js";

export type ContentEnv = { nodeEnv?: string; supabaseUrl?: string; anonKey?: string; serviceKey?: string };

/**
 * Demonstração sem login: só em `next dev` e sem nenhuma credencial do Supabase.
 * Build de produção (Vercel produção ou preview, `next start`) nunca abre, com ou sem NEXT_PUBLIC_DEMO:
 * variável pública não autoriza nada. Qualquer credencial presente (mesmo incompleta) = ambiente real, exige login.
 */
export function demoAllowed(e: ContentEnv): boolean {
  return e.nodeEnv === "development" && !e.supabaseUrl && !e.anonKey && !e.serviceKey;
}

/** null = pode entregar; senão, o erro a responder. */
export async function contentDenied(req: Request, e: ContentEnv, db: SupabaseClient | null): Promise<{ status: number; error: string } | null> {
  if (demoAllowed(e)) return null;
  if (!db) return { status: 503, error: "config" };

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return { status: 401, error: "auth" };

  const { data: u, error } = await db.auth.getUser(token);
  if (error || !u.user) return { status: 401, error: "auth" };

  const { data: member, error: dbError } = await db.from("members").select("access_status").eq("id", u.user.id).maybeSingle();
  if (dbError || member?.access_status !== "active") return { status: 403, error: "access" };
  return null;
}
