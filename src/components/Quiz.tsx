"use client";

// Orquestra o funil: landing → perguntas → roteamento → captura → rota + oferta.
// A lógica (pontuação, lead, UTM, pixel, checkout) é a mesma; as telas estão em ./funnel.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CHECKOUT_PREFILL, CHECKOUT_URL, OFFER } from "@/config";
import { QUESTIONS, ROUTES, decodeAnswers, encodeAnswers, scoreAnswers } from "@/lib/quiz";
import { buildCheckoutUrl, captureUtm, track, trackCustom, type Utm } from "@/lib/tracking";
import { Field, type FieldVariant } from "./Field";
import { Landing } from "./funnel/Landing";
import { Result } from "./funnel/Result";
import { Capture, Question, ROUTING_MS, Routing, type Lead } from "./funnel/Steps";
import { screenTransition } from "./ui";

type Stage =
  | { kind: "intro" }
  | { kind: "question"; index: number }
  | { kind: "routing" }
  | { kind: "capture" }
  | { kind: "result" };

const SAVE_KEY = "alpha_quiz";
// Intensidade do campo por etapa; o resultado fica sem decoração para a oferta respirar.
const FIELD: Record<Stage["kind"], FieldVariant | null> = {
  intro: "wide",
  question: "quiet",
  routing: "origin",
  capture: "whisper",
  result: null,
};
const ADVANCE_MS = 260;

export default function Quiz() {
  const [stage, setStage] = useState<Stage>({ kind: "intro" });
  const [answers, setAnswers] = useState<number[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [saved, setSaved] = useState<{ answers: number[]; lead: Lead | null } | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [utm, setUtm] = useState<Utm>({});
  const advanceTimer = useRef<number | undefined>(undefined);

  const go = useCallback((next: Stage) => {
    screenTransition(() => setStage(next));
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    setUtm(captureUtm());
    let prev: { answers: number[]; lead: Lead | null } | null = null;
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      const a = s && decodeAnswers(s.r);
      if (a) prev = { answers: a, lead: s.lead ?? null };
    } catch {}
    // ?r=102 abre a rota direto (links de lembrete do ManyChat — o lead já foi capturado).
    const params = new URLSearchParams(window.location.search);
    const fromUrl = decodeAnswers(params.get("r") || "");
    if (fromUrl) {
      setAnswers(fromUrl);
      setLead(prev?.lead ?? null);
      setStage({ kind: "result" });
    } else {
      if (prev) setSaved(prev);
      // ?start=1 (CTA do /v2): entra direto na pergunta 1, igual a clicar em "Comece".
      if (params.get("start") === "1") {
        setStage({ kind: "question", index: 0 });
        trackCustom("QuizInicio");
      }
    }
    return () => window.clearTimeout(advanceTimer.current);
  }, []);

  useEffect(() => {
    if (stage.kind !== "routing") return;
    const t = window.setTimeout(() => go({ kind: "capture" }), ROUTING_MS);
    return () => window.clearTimeout(t);
  }, [stage.kind, go]);

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
    go({ kind: "question", index: 0 });
    trackCustom("QuizInicio");
  }

  const choose = useCallback(
    (qIndex: number, optIndex: number) => {
      if (picked !== null) return;
      setPicked(optIndex);
      setAnswers((a) => [...a.slice(0, qIndex), optIndex]);
      advanceTimer.current = window.setTimeout(() => {
        screenTransition(() => {
          setPicked(null);
          if (qIndex + 1 < QUESTIONS.length) {
            setStage({ kind: "question", index: qIndex + 1 });
          } else {
            trackCustom("QuizConcluido");
            setStage({ kind: "routing" });
          }
        });
      }, ADVANCE_MS);
    },
    [picked],
  );

  function back(qIndex: number) {
    window.clearTimeout(advanceTimer.current);
    setPicked(null);
    go(qIndex === 0 ? { kind: "intro" } : { kind: "question", index: qIndex - 1 });
  }

  function showSaved() {
    if (!saved) return;
    setAnswers(saved.answers);
    setLead(saved.lead);
    go({ kind: "result" });
  }

  async function submitLead(l: Lead, consent: boolean, trap: string) {
    if (!route) return;
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...l, perfil: route.key, r: encodeAnswers(answers), utm, consentimento: consent, empresa: trap }),
        signal: AbortSignal.timeout(6000),
      });
    } catch {
      // Falha de rede não pode travar a rota: segue para o resultado.
    }
    track("Lead", { content_name: "rota", rota: route.key });
    setLead(l);
    go({ kind: "result" });
  }

  const stageKey = stage.kind === "question" ? `q${stage.index}` : stage.kind;
  const index = stage.kind === "question" ? stage.index : -1;
  const onChoose = useCallback((opt: number) => choose(index, opt), [choose, index]);

  return (
    <main className={`stage stage--${stage.kind}`}>
      {FIELD[stage.kind] && <Field variant={FIELD[stage.kind]!} />}
      <div className="screen" key={stageKey}>
        {stage.kind === "intro" && <Landing onStart={start} onSaved={saved ? showSaved : undefined} />}

        {stage.kind === "question" && (
          <Question
            index={stage.index}
            picked={picked}
            current={answers[stage.index]}
            onChoose={onChoose}
            onBack={() => back(stage.index)}
          />
        )}

        {stage.kind === "routing" && route && <Routing route={route} />}

        {stage.kind === "capture" && route && <Capture route={route} onSubmit={submitLead} />}

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
