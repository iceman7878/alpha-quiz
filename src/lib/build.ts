// Parte pública do 7-Day Build: tipos e Build Score. O conteúdo dos dias fica em
// build-content.ts (servidor) e só chega ao navegador depois do login.

import type { RouteKey } from "./quiz";

export type Answers = Record<string, string>;

export type Field = {
  id: string;
  label: string;
  hint?: string;
  multiline?: boolean;
};

export type Tool = { title: string; body: string };

/** Um passo do método. `points` = lista curta; `byRoute` = o mesmo passo aplicado a cada rota do quiz. */
export type Step = { title: string; text: string; points?: string[]; byRoute?: Record<RouteKey, string>; after?: string };

/** SEE IT: o mesmo movimento, antes e depois, em cada rota. */
export type Example = { route: RouteKey; before: string; after: string; why: string };

/** Roteiro dentro da aula (descoberta, conversa de venda). `note` explica o porquê da fala. */
export type ScriptLine = { who: "voce" | "cliente" | "tempo"; text: string; note?: string };
export type Script = { title: string; intro?: string; lines: ScriptLine[] };

/** Resposta a uma objeção: o que a pessoa diz, o que você responde, por quê. */
export type Reply = { says: string; answer: string; why: string };

export type Day = {
  n: number;
  code: string;
  name: string;
  title: string;
  objective: string;
  /** THE IDEA — a abertura que muda a forma de ver o problema. */
  idea: string;
  /** THE PRINCIPLE */
  principle: string[];
  /** THE METHOD */
  method: Step[];
  scripts?: Script[];
  replies?: Reply[];
  /** SEE IT — rótulos do antes/depois e um exemplo por rota. */
  seeIt: { before: string; after: string; examples: Example[] };
  fieldNote: string;
  fields: Field[];
  /** Modelo do entregável: {campo} é trocado pela resposta. */
  finalize: string;
  outputLabel: string;
  nextMove: { action: string; text: string };
  /** Arsenal: material de consulta, no fim do dia. */
  tools: Tool[];
};

export type BuildContent = { days: Day[]; day01Examples: Record<string, string> };

/** Monta o entregável do dia a partir do modelo e das respostas. */
export function renderOutput(template: string, a: Answers): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (a[k] || "").trim() || "…");
}

/** Build Score: 7 critérios objetivos, respondidos no DAY 07. */
export const SCORE_QUESTIONS = [
  "Você definiu uma direção?",
  "Você escolheu um problema específico?",
  "Você tem uma oferta escrita?",
  "Seu MVP está definido?",
  "Seu posicionamento está pronto?",
  "Você definiu como distribuir?",
  "Você colocou a oferta no mercado?",
];

export const LEVELS = {
  1: { code: "BUILD 01", title: "Você começou.", text: "A base existe. O próximo passo é fechar os dias que ficaram abertos e publicar." },
  2: { code: "BUILD 02", title: "Você construiu.", text: "A oferta existe. Falta o passo que transforma construção em ativo: colocar no mercado." },
  3: { code: "BUILD 03", title: "Você colocou no mercado.", text: "You built something. Now let's build something bigger." },
} as const;

export type Level = keyof typeof LEVELS;

/** yes[i] = resposta da pergunta i. BUILD 03 exige oferta no mercado. */
export function computeLevel(yes: boolean[]): { score: number; level: Level } {
  const score = yes.filter(Boolean).length;
  const launched = yes[SCORE_QUESTIONS.length - 1];
  const level: Level = launched && score >= 6 ? 3 : score >= 4 ? 2 : 1;
  return { score, level };
}
