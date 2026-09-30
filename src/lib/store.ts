// Camada de dados do app. Com Supabase configurado usa Auth + tabelas `members` e `progress`;
// sem as variáveis, roda em modo demonstração (tudo no navegador) para prévia e testes.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { decodeAnswers, scoreAnswers, type RouteKey } from "./quiz";
import type { Answers, Level } from "./build";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let client: SupabaseClient | null = null;
function sb(): SupabaseClient | null {
  if (!URL || !ANON) return null;
  if (!client) client = createClient(URL, ANON);
  return client;
}

export const isDemo = () => !sb();

export type Member = {
  email: string;
  nome: string | null;
  rota: RouteKey | null;
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
function quizRoute(): { rota: RouteKey | null; nome: string | null } {
  try {
    const s = JSON.parse(localStorage.getItem("alpha_quiz") || "null");
    const a = s && decodeAnswers(s.r);
    return { rota: a ? scoreAnswers(a) : null, nome: s?.lead?.nome ?? null };
  } catch {
    return { rota: null, nome: null };
  }
}

// ---------- auth ----------

export async function currentEmail(): Promise<string | null> {
  const c = sb();
  if (!c) return demoRead().logged ? "demo@alpha" : null;
  const { data } = await c.auth.getSession();
  return data.session?.user.email ?? null;
}

export async function signIn(email: string, password: string): Promise<string | null> {
  const c = sb();
  if (!c) {
    demoWrite({ ...demoRead(), logged: true });
    return null;
  }
  const { error } = await c.auth.signInWithPassword({ email, password });
  return error ? "E-mail ou senha incorretos." : null;
}

export async function signOut() {
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

// ---------- dados ----------

export async function loadMember(): Promise<Member | null> {
  const c = sb();
  const local = quizRoute();
  if (!c) {
    const d = demoRead();
    return { email: "demo@alpha", nome: local.nome, rota: local.rota ?? "servico", active: true, score: d.score, level: d.level };
  }
  const email = await currentEmail();
  if (!email) return null;
  const { data } = await c
    .from("members")
    .select("email, nome, rota, active, score, level")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (!data) return null;
  return { ...(data as Member), rota: (data.rota as RouteKey | null) ?? local.rota };
}

export async function loadProgress(): Promise<Progress> {
  const c = sb();
  if (!c) return demoRead().progress;
  const { data } = await c.from("progress").select("day, answers, completed_at");
  const out: Progress = {};
  for (const row of data ?? []) out[row.day] = { answers: row.answers ?? {}, completed: !!row.completed_at };
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
  const now = new Date().toISOString();
  const { error } = await c.from("progress").upsert({
    user_id: u.user.id,
    day,
    answers,
    completed_at: completed ? now : null,
    updated_at: now,
  });
  return error ? "Não foi possível salvar. Verifique a conexão." : null;
}

export async function saveScore(score: number, level: Level, yes: boolean[]): Promise<string | null> {
  const c = sb();
  if (!c) {
    demoWrite({ ...demoRead(), score, level });
    return null;
  }
  const email = await currentEmail();
  if (!email) return "Sessão expirada. Entre de novo.";
  const { error } = await c
    .from("members")
    .update({ score, level, score_answers: yes, score_at: new Date().toISOString() })
    .eq("email", email.toLowerCase());
  return error ? "Não foi possível salvar o Build Score." : null;
}
