// Camada de dados do app: Supabase Auth + tabelas `members` e `progress`.
// Modo demonstração (tudo no navegador) só em desenvolvimento ou com NEXT_PUBLIC_DEMO=1.
// Em produção sem Supabase: "misconfigured" — nada do produto é aberto.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { decodeAnswers, scoreAnswers, type RouteKey } from "./quiz";
import type { Answers, BuildContent, Level } from "./build";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const DEMO_ALLOWED = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEMO === "1";

export type Mode = "supabase" | "demo" | "misconfigured";
export const mode: Mode = URL && ANON ? "supabase" : DEMO_ALLOWED ? "demo" : "misconfigured";
export const isDemo = () => mode === "demo";

let client: SupabaseClient | null = null;
function sb(): SupabaseClient | null {
  if (mode !== "supabase") return null;
  if (!client) client = createClient(URL, ANON);
  return client;
}

export type Member = {
  email: string;
  nome: string | null;
  route: RouteKey | null;
  active: boolean;
  score: number | null;
  level: Level | null;
};

export type DayProgress = { answers: Answers; completed: boolean };
export type Progress = Record<number, DayProgress>;

const DEMO_KEY = "alpha_launch_demo";
type DemoState = { logged: boolean; progress: Progress; score: number | null; level: Level | null };

function demoRead(): DemoState {
  try {
    const s = JSON.parse(localStorage.getItem(DEMO_KEY) || "null");
    if (s) return s;
  } catch {}
  return { logged: false, progress: {}, score: null, level: null };
}
function demoWrite(s: DemoState) {
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(s));
  } catch {}
}

/** Rota salva pelo quiz neste navegador (fallback quando o membro não tem rota registrada). */
function quizRoute(): { route: RouteKey | null; nome: string | null } {
  try {
    const s = JSON.parse(localStorage.getItem("alpha_quiz") || "null");
    const a = s && decodeAnswers(s.r);
    return { route: a ? scoreAnswers(a) : null, nome: s?.lead?.nome ?? null };
  } catch {
    return { route: null, nome: null };
  }
}

// ---------- auth ----------

export async function currentEmail(): Promise<string | null> {
  const c = sb();
  if (!c) return mode === "demo" && demoRead().logged ? "demo@alpha" : null;
  const { data } = await c.auth.getSession();
  return data.session?.user.email ?? null;
}

export async function signIn(email: string, password: string): Promise<string | null> {
  if (mode === "misconfigured") return "Área de membros em configuração. Tente novamente em instantes.";
  const c = sb();
  if (!c) {
    demoWrite({ ...demoRead(), logged: true });
    return null;
  }
  const { error } = await c.auth.signInWithPassword({ email, password });
  return error ? "E-mail ou senha incorretos." : null;
}

export async function signOut() {
  contentCache = null;
  const c = sb();
  if (!c) return demoWrite({ ...demoRead(), logged: false });
  await c.auth.signOut();
}

export async function sendReset(email: string): Promise<string | null> {
  const c = sb();
  if (!c) return null;
  const { error } = await c.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/definir-senha`,
  });
  return error ? "Não foi possível enviar agora. Tente de novo em alguns minutos." : null;
}

/** Usado depois do link de convite/recuperação: a sessão vem no próprio link. */
export async function setPassword(password: string): Promise<string | null> {
  const c = sb();
  if (!c) return null;
  const { data } = await c.auth.getSession();
  if (!data.session) return "Link expirado. Peça um novo em “Esqueci minha senha”.";
  const { error } = await c.auth.updateUser({ password });
  return error ? "Não foi possível salvar a senha. Use pelo menos 8 caracteres." : null;
}

// ---------- conteúdo (protegido) ----------

let contentCache: BuildContent | null = null;

/** Conteúdo dos 7 dias: só chega depois de sessão válida + acesso ativo. Uma busca por sessão. */
export async function loadContent(): Promise<BuildContent | null> {
  if (contentCache) return contentCache;
  const headers: Record<string, string> = {};
  const c = sb();
  if (c) {
    const { data } = await c.auth.getSession();
    if (!data.session) return null;
    headers.authorization = `Bearer ${data.session.access_token}`;
  }
  const res = await fetch("/api/build/content", { headers, cache: "no-store" });
  if (!res.ok) return null;
  contentCache = (await res.json()) as BuildContent;
  return contentCache;
}

// ---------- dados ----------

export async function loadMember(): Promise<Member | null> {
  const local = quizRoute();
  const c = sb();
  if (!c) {
    if (mode !== "demo") return null;
    const d = demoRead();
    return { email: "demo@alpha", nome: local.nome, route: local.route ?? "servico", active: true, score: d.score, level: d.level };
  }
  const { data: u } = await c.auth.getUser();
  if (!u.user) return null;
  const { data } = await c
    .from("members")
    .select("email, nome, route, access_status, score, level")
    .eq("id", u.user.id)
    .maybeSingle();
  if (!data) return null;
  return {
    email: data.email,
    nome: data.nome,
    route: (data.route as RouteKey | null) ?? local.route,
    active: data.access_status === "active",
    score: data.score,
    level: data.level as Level | null,
  };
}

export async function loadProgress(): Promise<Progress> {
  const c = sb();
  if (!c) return demoRead().progress;
  const { data } = await c.from("progress").select("day, answers, completed");
  const out: Progress = {};
  for (const row of data ?? []) out[row.day] = { answers: row.answers ?? {}, completed: !!row.completed };
  return out;
}

export async function saveDay(day: number, answers: Answers, completed: boolean): Promise<string | null> {
  const c = sb();
  if (!c) {
    const d = demoRead();
    demoWrite({ ...d, progress: { ...d.progress, [day]: { answers, completed } } });
    return null;
  }
  const { data: u } = await c.auth.getUser();
  if (!u.user) return "Sessão expirada. Entre de novo.";
  const { error } = await c
    .from("progress")
    .upsert({ user_id: u.user.id, day, answers, completed }, { onConflict: "user_id,day" });
  return error ? "Não foi possível salvar. Verifique a conexão." : null;
}

export async function saveScore(score: number, level: Level, yes: boolean[]): Promise<string | null> {
  const c = sb();
  if (!c) {
    demoWrite({ ...demoRead(), score, level });
    return null;
  }
  const { data: u } = await c.auth.getUser();
  if (!u.user) return "Sessão expirada. Entre de novo.";
  const { error } = await c
    .from("members")
    .update({ score, level, score_answers: yes, score_at: new Date().toISOString() })
    .eq("id", u.user.id);
  return error ? "Não foi possível salvar o Build Score." : null;
}
