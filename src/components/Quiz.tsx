"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CHECKOUT_URL, OFFER } from "@/config";
import { PROFILES, QUESTIONS, decodeAnswers, encodeAnswers, scoreAnswers } from "@/lib/quiz";
import { buildCheckoutUrl, captureUtm, track, trackCustom, type Utm } from "@/lib/tracking";
import { Field, Origin } from "./Field";

type Stage = { kind: "intro" } | { kind: "question"; index: number } | { kind: "analyzing" } | { kind: "result" };

const RESULT_KEY = "alpha_quiz";
const ADVANCE_MS = 240;
const ANALYZE_STEPS = ["Cruzando tempo e capital disponível", "Lendo sua relação com exposição", "Definindo o modelo de distribuição"];
const ANALYZE_STEP_MS = 900;

const pad = (n: number) => String(n).padStart(2, "0");

export default function Quiz() {
  const [stage, setStage] = useState<Stage>({ kind: "intro" });
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [saved, setSaved] = useState<number[] | null>(null);
  const [utm, setUtm] = useState<Utm>({});
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const advanceTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    setUtm(captureUtm());
    // ?r=1302213 abre o resultado direto (links de lembrete do ManyChat).
    const fromUrl = decodeAnswers(new URLSearchParams(window.location.search).get("r") || "");
    if (fromUrl) {
      setAnswers(fromUrl);
      setStage({ kind: "result" });
      return;
    }
    try {
      const s = JSON.parse(localStorage.getItem(RESULT_KEY) || "null");
      const prev = s && decodeAnswers(s.r);
      if (prev) setSaved(prev);
    } catch {}
    return () => window.clearTimeout(advanceTimer.current);
  }, []);

  useEffect(() => {
    if (stage.kind !== "analyzing") return;
    setAnalyzeStep(0);
    const timers = ANALYZE_STEPS.map((_, i) => window.setTimeout(() => setAnalyzeStep(i + 1), ANALYZE_STEP_MS * (i + 1)));
    const done = window.setTimeout(() => setStage({ kind: "result" }), ANALYZE_STEP_MS * ANALYZE_STEPS.length + 400);
    return () => [...timers, done].forEach(window.clearTimeout);
  }, [stage.kind]);

  const profile = useMemo(
    () => (answers.length === QUESTIONS.length ? PROFILES[scoreAnswers(answers)] : null),
    [answers],
  );

  useEffect(() => {
    if (stage.kind !== "result" || !profile) return;
    const r = encodeAnswers(answers);
    try {
      localStorage.setItem(RESULT_KEY, JSON.stringify({ r, perfil: profile.key, ts: Date.now() }));
    } catch {}
    trackCustom("QuizResultado", { perfil: profile.key });
    track("ViewContent", { content_name: OFFER.name, value: OFFER.price, currency: "BRL" });
  }, [stage.kind, profile, answers]);

  function start() {
    setAnswers([]);
    setPicked(null);
    setStage({ kind: "question", index: 0 });
    trackCustom("QuizInicio");
  }

  function choose(qIndex: number, optIndex: number) {
    if (picked !== null) return;
    setPicked(optIndex);
    const next = [...answers.slice(0, qIndex), optIndex];
    setAnswers(next);
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
    setAnswers(saved);
    setStage({ kind: "result" });
  }

  const stageKey = stage.kind === "question" ? `q${stage.index}` : stage.kind;

  return (
    <main className="stage">
      <Field variant={stage.kind === "result" ? "origin" : stage.kind === "intro" ? "wide" : "quiet"} />
      <div className="screen" key={stageKey}>
        {stage.kind === "intro" && (
          <section className="intro">
            <span className="micro micro--corner">CAMPO 01</span>
            <div className="intro__body">
              <h1 className="wordmark">ALPHA</h1>
              <span className="micro">BUILD THE LIFE YOU WANT</span>
              <h2 className="intro__title">Qual modelo de negócio digital encaixa na sua realidade?</h2>
              <p className="lead">
                Sete perguntas sobre o seu tempo, o seu capital e a sua disposição para aparecer. No fim, você recebe
                o modelo que faz mais sentido para começar — e por quê.
              </p>
              <div className="actions">
                <button className="btn btn--primary" onClick={start}>
                  Começar
                </button>
                {saved && (
                  <button className="btn btn--ghost" onClick={showSaved}>
                    Ver meu último resultado
                  </button>
                )}
              </div>
            </div>
            <span className="micro micro--foot">07 PERGUNTAS — 2 MIN</span>
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
            <h2 className="analyzing__title">Analisando suas respostas…</h2>
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

        {stage.kind === "result" && profile && (
          <Result
            profile={profile}
            checkoutHref={buildCheckoutUrl(CHECKOUT_URL, utm, {
              perfil: profile.key,
              r: encodeAnswers(answers),
              src: "quiz",
              sck: `${profile.key}-${encodeAnswers(answers)}`,
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

function Result(props: { profile: (typeof PROFILES)[keyof typeof PROFILES]; checkoutHref: string; onRestart: () => void }) {
  const { profile } = props;
  return (
    <section className="result">
      <div className="result__origin">
        <Origin />
        <span className="micro">ORIGEM</span>
      </div>

      <span className="micro">DIAGNÓSTICO — MODELO {profile.code}</span>
      <p className="result__eyebrow">Seu perfil é</p>
      <h2 className="result__name">{profile.name}</h2>
      <p className="result__model">
        Modelo indicado: <strong>{profile.model}</strong>
      </p>
      <p className="lead">{profile.summary}</p>

      <div className="result__diag">
        {profile.diagnosis.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <p className="result__first">
          <span>Primeiro movimento</span>
          {profile.firstMove}
        </p>
      </div>

      <div className="offer">
        <h3 className="offer__title">{OFFER.name}</h3>
        <p className="offer__sub">O passo a passo do modelo {profile.model.toLowerCase()} para o perfil {profile.name}.</p>
        <ul className="offer__list">
          <li>Diagnóstico completo do seu perfil, a partir das suas respostas</li>
          <li>Plano de 14 dias em checklist, com o seu progresso salvo</li>
          <li>Kit de templates: planilhas, scripts de DM e modelos de conteúdo prontos para copiar</li>
        </ul>
        <div className="offer__price">
          <span className="offer__value">{OFFER.priceLabel}</span>
          <span className="offer__note">pagamento único · acesso imediato por e-mail</span>
        </div>
        <a
          className="btn btn--primary btn--block"
          href={props.checkoutHref}
          onClick={() =>
            track("InitiateCheckout", { content_name: OFFER.name, value: OFFER.price, currency: "BRL", perfil: profile.key })
          }
        >
          Acessar o meu Mapa
        </a>
        <p className="offer__disclaimer">
          O Mapa organiza o caminho. O resultado depende da sua execução — não há promessa de ganho.
        </p>
      </div>

      <button className="btn btn--ghost" onClick={props.onRestart}>
        Refazer o quiz
      </button>
    </section>
  );
}
