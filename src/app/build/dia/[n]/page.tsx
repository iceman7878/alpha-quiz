"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AreaFallback, CopyButton, Shell, useArea } from "@/components/area";
import { DAY01_EXAMPLES, DAYS, type Answers } from "@/lib/build";
import { ROUTES } from "@/lib/quiz";
import { saveDay } from "@/lib/store";

const AUTOSAVE_MS = 1500;

export default function DayPage() {
  const { state } = useArea();
  const params = useParams<{ n: string }>();
  const n = Number(params.n);
  const day = DAYS.find((d) => d.n === n);

  if (state.status !== "ready") return <AreaFallback state={state} />;
  if (!day) {
    return (
      <Shell back={{ href: "/build", label: "Seu build" }}>
        <h1 className="area__title">Dia não encontrado.</h1>
      </Shell>
    );
  }
  const saved = state.progress[n];
  return (
    <DayView
      key={n}
      n={n}
      initial={saved?.answers ?? {}}
      initiallyDone={!!saved?.completed}
      route={state.member.rota}
    />
  );
}

function DayView(props: { n: number; initial: Answers; initiallyDone: boolean; route: keyof typeof ROUTES | null }) {
  const router = useRouter();
  const day = DAYS.find((d) => d.n === props.n)!;
  const [answers, setAnswers] = useState<Answers>(props.initial);
  const [done, setDone] = useState(props.initiallyDone);
  const [status, setStatus] = useState<"" | "saving" | "saved" | string>("");
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  // Autosave: sair e voltar mantém tudo.
  useEffect(() => {
    if (!dirty.current) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setStatus("saving");
      const err = await saveDay(day.n, answers, done);
      setStatus(err || "saved");
      dirty.current = false;
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer.current);
  }, [answers, done, day.n]);

  function update(id: string, value: string) {
    dirty.current = true;
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  const filled = day.fields.filter((f) => (answers[f.id] || "").trim()).length;
  const output = day.finalize(answers, props.route ?? "servico");

  async function complete() {
    window.clearTimeout(timer.current);
    setStatus("saving");
    const err = await saveDay(day.n, answers, true);
    if (err) return setStatus(err);
    setDone(true);
    router.push(day.n < 7 ? `/build/dia/${day.n + 1}` : "/build/score");
  }

  async function saveNow() {
    window.clearTimeout(timer.current);
    setStatus("saving");
    const err = await saveDay(day.n, answers, done);
    dirty.current = false;
    setStatus(err || "saved");
  }

  return (
    <Shell back={{ href: "/build", label: "Seu build" }}>
      <span className="micro">
        {day.code} — {day.name}
      </span>
      <h1 className="area__title">{day.title}</h1>
      <p className="day__objective">{day.objective}</p>
      {day.n === 1 && props.route && (
        <p className="day__route">
          Sua rota pelo quiz: <strong>{ROUTES[props.route].name}</strong>. {ROUTES[props.route].statement}
        </p>
      )}

      <section className="day__block">
        <h2 className="day__step">01 · Entenda</h2>
        <div className="day__text">
          {day.understand.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>

      <section className="day__block">
        <h2 className="day__step">02 · Faça</h2>
        <div className="form day__form">
          {day.fields.map((f) => {
            const hint = day.n === 1 && f.id === "direcao" && props.route ? DAY01_EXAMPLES[props.route] : f.hint;
            return (
              <label className="input" key={f.id}>
                <span>{f.label}</span>
                {f.multiline ? (
                  <textarea rows={4} value={answers[f.id] || ""} onChange={(e) => update(f.id, e.target.value)} />
                ) : (
                  <input value={answers[f.id] || ""} onChange={(e) => update(f.id, e.target.value)} />
                )}
                {hint && <small>{hint}</small>}
              </label>
            );
          })}
        </div>
      </section>

      <section className="day__block">
        <h2 className="day__step">03 · Finalize</h2>
        <div className="output">
          <div className="output__head">
            <span>{day.outputLabel}</span>
            <CopyButton text={output} />
          </div>
          <pre className="output__body">{output}</pre>
          <p className="output__meta">
            {filled} de {day.fields.length} campos preenchidos
          </p>
        </div>
      </section>

      {day.tools.length > 0 && (
        <section className="day__block">
          <h2 className="day__step">Ferramentas</h2>
          <div className="tools">
            {day.tools.map((t) => (
              <details key={t.title} className="tool">
                <summary>{t.title}</summary>
                <pre>{t.body}</pre>
                <CopyButton text={t.body} />
              </details>
            ))}
          </div>
        </section>
      )}

      <div className="day__actions">
        <button className="btn btn--ghost" onClick={saveNow}>
          Salvar
        </button>
        <button className="btn btn--primary" onClick={complete} disabled={filled === 0}>
          {day.n < 7 ? `Concluir ${day.code} →` : "Concluir e fazer o Build Score →"}
        </button>
      </div>
      <p className="day__status" aria-live="polite">
        {status === "saving" ? "Salvando…" : status === "saved" ? (done ? "Salvo · dia concluído" : "Salvo") : status}
      </p>
    </Shell>
  );
}
