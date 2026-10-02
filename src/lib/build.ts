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
  // "{campo}." com resposta vazia ou já pontuada não ganha ponto extra ("…." / "fim..").
  return template.replace(/\{(\w+)\}(\.?)/g, (_, k: string, dot: string) => {
    const v = (a[k] || "").trim() || "…";
    return dot && /[.…!?]$/.test(v) ? v : v + dot;
  });
}

// ---------- FIRST MARKET TEST ----------
// O documento final: só respostas reais da pessoa, organizadas na ordem do raciocínio.
// Campo vazio = "…". Nada é inventado para preencher lacuna.

export type FmtRow = { label: string; value: string; list?: boolean };
export type FmtSection = { n: number; stage: string; question: string; lead: FmtRow; rows: FmtRow[] };
export type Fmt = { sections: FmtSection[]; firstPerson: string; review: string };

const val = (v?: string) => (v || "").trim() || "…";
const lines = (v?: string) =>
  (v || "")
    .split("\n")
    .map((l) => l.replace(/^\s*(\d+[.)]|[-•–—])\s*/, "").trim())
    .filter(Boolean);

export function firstMarketTest(byDay: Record<number, Answers | undefined>): Fmt {
  const d = (n: number) => byDay[n] ?? {};
  const [d1, d2, d3, d4, d5, d6, d7] = [1, 2, 3, 4, 5, 6, 7].map(d);
  const r = (label: string, v?: string, list = false): FmtRow => ({ label, value: val(v), list });
  const sections: FmtSection[] = [
    { n: 1, stage: "DIRECTION", question: "O que estou construindo", lead: r("Direção", d1.direcao), rows: [r("Para quem", d1.publico), r("Por que eu", d1.vantagem), r("Fora destes 7 dias", d1.corte)] },
    { n: 2, stage: "PROBLEM", question: "Qual problema resolvo", lead: r("O problema, nas palavras do cliente", d2.problema), rows: [r("Quem sente mais", d2.quem), r("Como resolve hoje", d2.hoje), r("Custo de não resolver", d2.custo), r("Evidências", d2.evidencia)] },
    { n: 3, stage: "OFFER", question: "Qual é a oferta", lead: r("Resultado", d3.resultado), rows: [r("Para quem", d3.quem), r("Mecanismo", d3.mecanismo), r("O que a pessoa recebe", d3.entrega), r("Preço", d3.preco)] },
    { n: 4, stage: "MVP", question: "Como entrego", lead: r("O mínimo que entrega o resultado", d4.minimo), rows: [r("Formato", d4.como), r("Primeira entrega pronta até", d4.prazo), r("Fica para a versão 2", d4.v2)] },
    { n: 5, stage: "POSITION", question: "Como me posiciono", lead: r("Headline", d5.headline), rows: [r("Subheadline", d5.sub), r("Promessa", d5.promessa), r("Benefícios", d5.beneficios), r("CTA", d5.cta), r("Bio", d5.bio)] },
    { n: 6, stage: "DISTRIBUTION", question: "Onde encontro pessoas", lead: r("Onde estão as primeiras 30", d6.onde), rows: [r("Caminho", d6.caminho), r("Canal", d6.canal), r("Frequência", d6.frequencia), r("Hooks", d6.hooks), r("Conteúdos prontos", d6.conteudos), r("CTA", d6.cta)] },
    { n: 7, stage: "FIRST 10", question: "Quem são os primeiros 10", lead: r("Lista", lines(d7.lista).join("\n"), true), rows: [r("Primeira mensagem", d7.abordagem)] },
    { n: 8, stage: "LAUNCH", question: "Como coloco no mercado", lead: r("Oferta no ar", d7.link), rows: [r("Primeiro conteúdo", d7.post), r("Métrica", d7.metrica), r("Revisão", d7.revisao)] },
  ];
  return { sections, firstPerson: lines(d7.lista)[0] ?? "…", review: val(d7.revisao) };
}

/** Texto limpo do documento, útil fora do produto (notas, WhatsApp, e-mail). */
export function fmtText(f: Fmt, nome?: string | null): string {
  const out = ["FIRST MARKET TEST" + (nome ? ` — ${nome}` : ""), ""];
  for (const s of f.sections) {
    out.push(`${String(s.n).padStart(2, "0")} — ${s.stage}`, s.question, "");
    const lead = s.lead.list && s.lead.value !== "…" ? s.lead.value.split("\n").map((l, i) => `${i + 1}. ${l}`).join("\n") : s.lead.value;
    out.push(lead, "");
    for (const row of s.rows) out.push(row.value.includes("\n") ? `${row.label}:\n${row.value}` : `${row.label}: ${row.value}`);
    out.push("");
  }
  out.push("NEXT MOVE", `Mande a mensagem para ${f.firstPerson}. Depois, as outras 9 até ${f.review}.`, "", "ALPHA — BUILD THE LIFE YOU WANT");
  return out.join("\n");
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
