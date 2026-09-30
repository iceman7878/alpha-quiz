"use client";

// Etapas do quiz: pergunta → roteamento → captura.

import { useEffect, useState, type CSSProperties } from "react";
import { QUESTIONS, type Route } from "@/lib/quiz";
import { Rail, RouteMap } from "../ui";

const pad = (n: number) => String(n).padStart(2, "0");
const STEP_NAMES = ["Partida", "Exposição", "Ritmo"];

export function QuizRail({ index }: { index: number }) {
  return (
    <Rail
      className="quizrail"
      ariaLabel="Progresso do quiz"
      labels
      progress={index / (QUESTIONS.length - 1)}
      nodes={QUESTIONS.map((_, i) => ({ label: STEP_NAMES[i], done: i < index, current: i === index }))}
    />
  );
}

export function Question(props: {
  index: number;
  picked: number | null;
  current?: number;
  onChoose: (opt: number) => void;
  onBack: () => void;
}) {
  const q = QUESTIONS[props.index];
  const { onChoose, index } = props;

  // Teclado: A–D ou 1–4 escolhem a resposta.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const i = "abcd".indexOf(k) >= 0 ? "abcd".indexOf(k) : "1234".indexOf(k);
      if (i >= 0 && i < QUESTIONS[index].options.length) onChoose(i);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, onChoose]);

  return (
    <section className="qstep wrap">
      <header className="qstep__bar">
        <button className="btn btn--quiet" onClick={props.onBack}>
          ← Voltar
        </button>
        <span className="micro num">
          {pad(props.index + 1)} — {pad(QUESTIONS.length)}
        </span>
      </header>
      <QuizRail index={props.index} />

      <div className="qstep__body">
        <h1 className="h1 qstep__title enter">{q.title}</h1>
        {q.hint && (
          <p className="body qstep__hint enter" style={{ "--i": 1 } as CSSProperties}>
            {q.hint}
          </p>
        )}
        <ol className="answers" role="list">
          {q.options.map((o, i) => {
            const selected = props.picked === i || (props.picked === null && props.current === i);
            return (
              <li key={o.label} className="enter" style={{ "--i": i + 2 } as CSSProperties}>
                <button
                  className={`answer${selected ? " is-selected" : ""}${props.picked !== null && !selected ? " is-dim" : ""}`}
                  onClick={() => props.onChoose(i)}
                  aria-pressed={selected}
                >
                  <kbd className="answer__key">{String.fromCharCode(65 + i)}</kbd>
                  <span className="answer__text">{o.label}</span>
                  <span className="answer__go" aria-hidden>
                    →
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="caption qstep__keys">
          Toque na resposta — ou use as teclas <kbd>A</kbd>–<kbd>{String.fromCharCode(64 + q.options.length)}</kbd>.
        </p>
      </div>
    </section>
  );
}

const ROUTING_LINES = ["Ponto de partida", "Exposição", "Ritmo", "Rota definida"];
export const ROUTING_MS = 2700;

export function Routing({ route }: { route: Route }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = ROUTING_LINES.map((_, i) => window.setTimeout(() => setStep(i + 1), 420 + i * 520));
    return () => t.forEach(window.clearTimeout);
  }, []);
  return (
    <section className="routing wrap" aria-live="polite">
      <span className="micro">ROUTING</span>
      <h1 className="h1 routing__title">Cruzando suas respostas.</h1>
      <RouteMap picked={route.key} draw className="routing__map" />
      <ol className="routing__log">
        {ROUTING_LINES.map((l, i) => (
          <li key={l} className={i < step ? "is-on" : ""}>
            <span className="num">{pad(i + 1)}</span> {l}
            {i === ROUTING_LINES.length - 1 && i < step ? "." : ""}
          </li>
        ))}
      </ol>
    </section>
  );
}

export type Lead = { nome: string; whatsapp: string; email: string };

/** Aceita "(11) 91234-5678", "11912345678" ou "+55 11 …" e devolve "5511912345678". */
function normalizeWhatsapp(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) d = "55" + d;
  return /^55\d{10,11}$/.test(d) ? d : null;
}

export function Capture(props: { route: Route; onSubmit: (lead: Lead, consent: boolean) => Promise<void> }) {
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
    await props.onSubmit({ nome: nome.trim().split(/\s+/)[0], whatsapp: phone, email: email.trim() }, consent);
  }

  return (
    <section className="capture wrap">
      <div className="capture__copy">
        <span className="micro enter">ROTA DEFINIDA</span>
        <h1 className="h1 capture__title enter" style={{ "--i": 1 } as CSSProperties}>
          Seu plano personalizado está pronto.
        </h1>
        <p className="lead enter" style={{ "--i": 2 } as CSSProperties}>
          Vamos salvar seu plano para você não perder nada.
        </p>
        <RouteMap picked={props.route.key} className="routemap--veiled capture__map enter" />
      </div>
      <form className="capture__form enter" style={{ "--i": 3 } as CSSProperties} onSubmit={submit} noValidate>
        <label className="box">
          <span>Primeiro nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="given-name" maxLength={60} />
        </label>
        <label className="box">
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
        <label className="box">
          <span>E-mail (opcional)</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" autoComplete="email" maxLength={120} />
        </label>
        <label className="check">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>Aceito receber o plano e mensagens da ALPHA pelo WhatsApp. Posso sair quando quiser.</span>
        </label>
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={sending}>
          {sending ? "Salvando…" : "Ver meu plano"} {!sending && <span className="btn__arrow">→</span>}
        </button>
      </form>
    </section>
  );
}
