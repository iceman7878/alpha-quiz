"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CHECKOUT_PREFILL, CHECKOUT_URL, OFFER } from "@/config";
import {
  BUILD_DAYS,
  QUESTIONS,
  ROUTES,
  decodeAnswers,
  encodeAnswers,
  personalLine,
  scoreAnswers,
  type Route,
} from "@/lib/quiz";
import { buildCheckoutUrl, captureUtm, track, trackCustom, type Utm } from "@/lib/tracking";
import { Field } from "./Field";

type Stage =
  | { kind: "intro" }
  | { kind: "question"; index: number }
  | { kind: "analyzing" }
  | { kind: "capture" }
  | { kind: "result" };

type Lead = { nome: string; whatsapp: string; email: string };

const SAVE_KEY = "alpha_quiz";
const ADVANCE_MS = 240;
const ANALYZE_STEPS = ["Organizando suas escolhas", "Cruzando ponto de partida e ritmo", "Montando sua rota"];
const ANALYZE_STEP_MS = 800;

const pad = (n: number) => String(n).padStart(2, "0");

/** Aceita "(11) 91234-5678", "11912345678" ou "+55 11 …" e devolve "5511912345678". */
function normalizeWhatsapp(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) d = "55" + d;
  return /^55\d{10,11}$/.test(d) ? d : null;
}

export default function Quiz() {
  const [stage, setStage] = useState<Stage>({ kind: "intro" });
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [saved, setSaved] = useState<{ answers: number[]; lead: Lead | null } | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [utm, setUtm] = useState<Utm>({});
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const advanceTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setUtm(captureUtm());
    let prev: { answers: number[]; lead: Lead | null } | null = null;
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      const a = s && decodeAnswers(s.r);
      if (a) prev = { answers: a, lead: s.lead ?? null };
    } catch {}
    // ?r=102 abre a rota direto (links de lembrete do ManyChat — o lead já foi capturado).
    const fromUrl = decodeAnswers(new URLSearchParams(window.location.search).get("r") || "");
    if (fromUrl) {
      setAnswers(fromUrl);
      setLead(prev?.lead ?? null);
      setStage({ kind: "result" });
    } else if (prev) {
      setSaved(prev);
    }
    return () => window.clearTimeout(advanceTimer.current);
  }, []);

  useEffect(() => {
    if (stage.kind !== "analyzing") return;
    setAnalyzeStep(0);
    const timers = ANALYZE_STEPS.map((_, i) => window.setTimeout(() => setAnalyzeStep(i + 1), ANALYZE_STEP_MS * (i + 1)));
    const done = window.setTimeout(() => setStage({ kind: "capture" }), ANALYZE_STEP_MS * ANALYZE_STEPS.length + 400);
    return () => [...timers, done].forEach(window.clearTimeout);
  }, [stage.kind]);

  const route = useMemo(
    () => (answers.length === QUESTIONS.length ? ROUTES[scoreAnswers(answers)] : null),
    [answers],
  );

  useEffect(() => {
    if (stage.kind !== "result" || !route) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ r: encodeAnswers(answers), rota: route.key, lead, ts: Date.now() }));
    } catch {}
    trackCustom("QuizRota", { rota: route.key });
    track("ViewContent", { content_name: OFFER.name, value: OFFER.price, currency: "BRL" });
  }, [stage.kind, route, answers, lead]);

  function start() {
    setAnswers([]);
    setPicked(null);
    setStage({ kind: "question", index: 0 });
    trackCustom("QuizInicio");
  }

  function choose(qIndex: number, optIndex: number) {
    if (picked !== null) return;
    setPicked(optIndex);
    setAnswers([...answers.slice(0, qIndex), optIndex]);
    advanceTimer.current = window.setTimeout(() => {
      setPicked(null);
      if (qIndex + 1 < QUESTIONS.length) {
        setStage({ kind: "question", index: qIndex + 1 });
      } else {
        trackCustom("QuizConcluido");
        setStage({ kind: "analyzing" });
      }
    }, ADVANCE_MS);
  }

  function back(qIndex: number) {
    window.clearTimeout(advanceTimer.current);
    setPicked(null);
    setStage(qIndex === 0 ? { kind: "intro" } : { kind: "question", index: qIndex - 1 });
  }

  function showSaved() {
    if (!saved) return;
    setAnswers(saved.answers);
    setLead(saved.lead);
    setStage({ kind: "result" });
  }

  const stageKey = stage.kind === "question" ? `q${stage.index}` : stage.kind;
  const fieldVariant = stage.kind === "result" ? "origin" : stage.kind === "intro" ? "wide" : "quiet";

  return (
    <main className="stage">
      <Field variant={fieldVariant} />
      <div className="screen" key={stageKey}>
        {stage.kind === "intro" && (
          <section className="intro">
            <span className="micro micro--corner">CAMPO 01</span>
            <div className="intro__body">
              <h1 className="wordmark">ALPHA</h1>
              <span className="micro">BUILD THE LIFE YOU WANT</span>
              <h2 className="intro__title">Qual é a sua rota para construir o primeiro ativo digital?</h2>
              <p className="lead">
                Três perguntas sobre o que você já tem, como prefere aparecer e o ritmo possível agora. No fim, você
                recebe a sua rota — e o que construir primeiro.
              </p>
              <div className="actions">
                <button className="btn btn--primary" onClick={start}>
                  Montar minha rota
                </button>
                {saved && (
                  <button className="btn btn--ghost" onClick={showSaved}>
                    Ver minha rota salva
                  </button>
                )}
              </div>
            </div>
            <span className="micro micro--foot">03 PERGUNTAS — 1 MIN</span>
          </section>
        )}

        {stage.kind === "question" && (
          <Question
            index={stage.index}
            picked={picked}
            current={answers[stage.index]}
            onChoose={(opt) => choose(stage.index, opt)}
            onBack={() => back(stage.index)}
          />
        )}

        {stage.kind === "analyzing" && (
          <section className="analyzing" aria-live="polite">
            <span className="micro">ANÁLISE</span>
            <h2 className="analyzing__title">Montando sua rota…</h2>
            <div className="bar">
              <div className="bar__fill" style={{ transform: `scaleX(${analyzeStep / ANALYZE_STEPS.length})` }} />
            </div>
            <ul className="analyzing__steps">
              {ANALYZE_STEPS.map((s, i) => (
                <li key={s} className={i < analyzeStep ? "is-done" : i === analyzeStep ? "is-active" : ""}>
                  {s}
                </li>
              ))}
            </ul>
          </section>
        )}

        {stage.kind === "capture" && route && (
          <Capture
            answers={answers}
            route={route}
            utm={utm}
            onDone={(l) => {
              setLead(l);
              setStage({ kind: "result" });
            }}
          />
        )}

        {stage.kind === "result" && route && (
          <Result
            route={route}
            answers={answers}
            lead={lead}
            checkoutHref={buildCheckoutUrl(CHECKOUT_URL, utm, {
              rota: route.key,
              r: encodeAnswers(answers),
              src: "quiz",
              sck: `${route.key}-${encodeAnswers(answers)}`,
              ...(lead && CHECKOUT_PREFILL.name ? { [CHECKOUT_PREFILL.name]: lead.nome } : {}),
              ...(lead?.email && CHECKOUT_PREFILL.email ? { [CHECKOUT_PREFILL.email]: lead.email } : {}),
              ...(lead && CHECKOUT_PREFILL.phone ? { [CHECKOUT_PREFILL.phone]: lead.whatsapp } : {}),
            })}
            onRestart={start}
          />
        )}
      </div>
    </main>
  );
}

function Question(props: {
  index: number;
  picked: number | null;
  current?: number;
  onChoose: (opt: number) => void;
  onBack: () => void;
}) {
  const q = QUESTIONS[props.index];
  return (
    <section className="question">
      <header className="question__head">
        <button className="back" onClick={props.onBack} aria-label="Voltar">
          ← Voltar
        </button>
        <span className="micro">
          {pad(props.index + 1)} — {pad(QUESTIONS.length)}
        </span>
      </header>
      <div className="progress" aria-hidden>
        <div className="progress__fill" style={{ transform: `scaleX(${(props.index + 1) / QUESTIONS.length})` }} />
      </div>
      <h2 className="question__title">{q.title}</h2>
      {q.hint && <p className="question__hint">{q.hint}</p>}
      <ol className="options">
        {q.options.map((o, i) => {
          const selected = props.picked === i || (props.picked === null && props.current === i);
          return (
            <li key={o.label}>
              <button
                className={`option${selected ? " is-selected" : ""}`}
                onClick={() => props.onChoose(i)}
                aria-pressed={selected}
              >
                <span className="option__idx">{String.fromCharCode(65 + i)}</span>
                <span>{o.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Capture(props: { answers: number[]; route: Route; utm: Utm; onDone: (lead: Lead) => void }) {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const phone = normalizeWhatsapp(whatsapp);
    if (!nome.trim()) return setError("Diga como podemos te chamar.");
    if (!phone) return setError("Confira o WhatsApp: DDD + número.");
    if (email && !/^\S+@\S+\.\S+$/.test(email)) return setError("Confira o e-mail — ou deixe em branco.");
    if (!consent) return setError("Para salvar o plano, precisamos do seu aceite.");
    setError("");
    setSending(true);
    const lead: Lead = { nome: nome.trim().split(/\s+/)[0], whatsapp: phone, email: email.trim() };
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...lead,
          perfil: props.route.key,
          r: encodeAnswers(props.answers),
          utm: props.utm,
          consentimento: consent,
        }),
        signal: AbortSignal.timeout(6000),
      });
    } catch {
      // Falha de rede não pode travar a rota: segue para o resultado.
    }
    track("Lead", { content_name: "rota", rota: props.route.key });
    props.onDone(lead);
  }

  return (
    <section className="capture">
      <span className="micro">PLANO PRONTO</span>
      <h2 className="capture__title">Seu plano personalizado está pronto.</h2>
      <p className="lead">Vamos salvar seu plano para você não perder nada.</p>
      <form className="form" onSubmit={submit} noValidate>
        <label className="input">
          <span>Primeiro nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="given-name" maxLength={60} />
        </label>
        <label className="input">
          <span>WhatsApp com DDD</span>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(11) 91234-5678"
            maxLength={20}
          />
        </label>
        <label className="input">
          <span>E-mail (opcional)</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            inputMode="email"
            autoComplete="email"
            maxLength={120}
          />
        </label>
        <label className="check">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>Aceito receber o plano e mensagens da ALPHA pelo WhatsApp. Posso sair quando quiser.</span>
        </label>
        {error && (
          <p className="form__error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn--primary btn--block" type="submit" disabled={sending}>
          {sending ? "Salvando…" : "Ver meu plano"}
        </button>
      </form>
    </section>
  );
}

const BUILD_OUTPUTS = [
  "uma direção definida",
  "um problema específico",
  "uma oferta estruturada",
  "seu MVP definido",
  "posicionamento e mensagem",
  "estratégia inicial de distribuição",
  "plano de lançamento",
  "checklist de execução",
];

const BUILD_LEVELS = [
  { code: "BUILD 01", text: "Você começou." },
  { code: "BUILD 02", text: "Você construiu." },
  { code: "BUILD 03", text: "Você colocou no mercado." },
];

function Result(props: { route: Route; answers: number[]; lead: Lead | null; checkoutHref: string; onRestart: () => void }) {
  const { route, lead } = props;
  const onCheckout = () =>
    track("InitiateCheckout", { content_name: OFFER.name, value: OFFER.price, currency: "BRL", rota: route.key });

  return (
    <section className="result">
      <span className="micro">SUA ROTA — {route.code}</span>
      <p className="result__eyebrow">{lead ? `${lead.nome}, sua rota é` : "Sua rota é"}</p>
      <h2 className="result__name">{route.name}</h2>
      <p className="result__model">{route.model}</p>
      <p className="result__personal">{personalLine(props.answers)}</p>
      <p className="lead">{route.statement}</p>

      <div className="result__diag">
        <p className="result__first">
          <span>Seu primeiro objetivo</span>
          {route.objective.join(" → ")}
        </p>
        <p className="result__first">
          <span>Seu DAY 01</span>
          {route.day01}
        </p>
        <p className="result__first">
          <span>Seu próximo passo</span>
          7-Day Build: 7 dias para transformar essa direção em uma oferta real.
        </p>
      </div>

      <div className="result__cta">
        <a className="btn btn--primary btn--block" href={props.checkoutHref} onClick={onCheckout}>
          Comece seu 7-Day Build — {OFFER.priceLabel}
        </a>
      </div>

      <div className="pitch">
        <h3 className="pitch__head">
          Stop consuming.
          <br />
          Start building.
        </h3>
        <p className="pitch__promise">Construa seu primeiro ativo digital em 7 dias.</p>
        <p className="pitch__body">
          Você não precisa de mais um curso. Não precisa passar meses estudando. E não precisa esperar estar pronto.
        </p>
        <p className="pitch__body">
          O ALPHA LAUNCH é um sprint de 7 dias criado para transformar uma direção em um ativo digital real, com uma
          oferta pronta para colocar no mercado.
        </p>
        <p className="pitch__line">7 dias. 1 construção. Execução real.</p>

        <h4 className="pitch__sub">Sua rota começa aqui.</h4>
        <p className="pitch__body">
          Com base nas suas respostas, você já descobriu qual direção faz mais sentido para você. Agora é hora de
          transformar essa direção em algo concreto.
        </p>
        <ol className="days">
          {BUILD_DAYS.map((d) => (
            <li key={d.code}>
              <span className="days__code">
                {d.code} — {d.name}
              </span>
              <span className="days__task">{d.task}</span>
            </li>
          ))}
        </ol>

        <h4 className="pitch__sub">O que você vai construir</h4>
        <p className="pitch__body">Não são dezenas de horas de aulas. É um sistema de execução. Você vai sair com:</p>
        <ul className="offer__list">
          {BUILD_OUTPUTS.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <p className="pitch__body pitch__body--after">Tudo dentro do app da ALPHA.</p>

        <h4 className="pitch__sub">No final, você vai saber onde está.</h4>
        <p className="pitch__body">
          No último dia, você avalia sua construção em 7 critérios objetivos. O resultado define seu Build Score:
        </p>
        <ol className="levels">
          {BUILD_LEVELS.map((l) => (
            <li key={l.code}>
              <span className="days__code">{l.code}</span>
              <span className="days__task">{l.text}</span>
            </li>
          ))}
        </ol>
        <p className="pitch__line">Porque estudar não é o objetivo. Construir é.</p>
      </div>

      <div className="offer">
        <h3 className="offer__title">{OFFER.name}</h3>
        <p className="offer__sub">7-Day Build · rota {route.name}</p>
        <div className="offer__price">
          <span className="offer__value">{OFFER.priceLabel}</span>
          <span className="offer__note">pagamento único · acesso imediato por e-mail</span>
        </div>
        <a className="btn btn--primary btn--block" href={props.checkoutHref} onClick={onCheckout}>
          Comece seu 7-Day Build →
        </a>
        <p className="offer__disclaimer">
          O ALPHA LAUNCH organiza a construção. O resultado depende da sua execução — não há promessa de ganho.
        </p>
      </div>

      <button className="btn btn--ghost" onClick={props.onRestart}>
        Refazer o quiz
      </button>

      <p className="signature">
        <span className="signature__mark">ALPHA</span>
        <span className="micro">BUILD THE LIFE YOU WANT</span>
      </p>
    </section>
  );
}
