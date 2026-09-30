"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { AreaFallback, Shell, useArea } from "@/components/area";
import { Arrow, Artifact, CopyButton, Tick } from "@/components/ui";
import { renderOutput, type Answers, type Day, type Field } from "@/lib/build";
import { ROUTES, type RouteKey } from "@/lib/quiz";
import { saveDay, type Progress } from "@/lib/store";

const AUTOSAVE_MS = 1200;

export default function DayPage() {
  const { state } = useArea();
  const params = useParams<{ n: string }>();
  const n = Number(params.n);
  if (state.status !== "ready") return <AreaFallback state={state} />;
  const day = state.content.days.find((d) => d.n === n);
  if (!day) {
    return (
      <Shell back={{ href: "/build", label: "Seu build" }} progress={state.progress}>
        <h1 className="h1">Dia não encontrado.</h1>
      </Shell>
    );
  }
  const saved = state.progress[n];
  return (
    <DayView
      key={n}
      day={day}
      total={state.content.days.length}
      progress={state.progress}
      example={state.member.route ? state.content.day01Examples[state.member.route] : undefined}
      initial={saved?.answers ?? {}}
      initiallyDone={!!saved?.completed}
      route={state.member.route}
    />
  );
}

type SaveState = "idle" | "saving" | "saved" | "error";

function DayView(props: {
  day: Day;
  total: number;
  progress: Progress;
  example?: string;
  initial: Answers;
  initiallyDone: boolean;
  route: RouteKey | null;
}) {
  const router = useRouter();
  const { day } = props;
  const [answers, setAnswers] = useState<Answers>(props.initial);
  const [done, setDone] = useState(props.initiallyDone);
  const [save, setSave] = useState<{ state: SaveState; msg?: string }>({ state: "idle" });
  const [completing, setCompleting] = useState(false);
  const dirty = useRef(false);
  const timer = useRef<number | undefined>(undefined);

  // Autosave: fechar e voltar mantém tudo.
  useEffect(() => {
    if (!dirty.current) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setSave({ state: "saving" });
      const err = await saveDay(day.n, answers, done);
      dirty.current = false;
      setSave(err ? { state: "error", msg: err } : { state: "saved" });
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer.current);
  }, [answers, done, day.n]);

  function update(id: string, value: string) {
    dirty.current = true;
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  const filled = day.fields.filter((f) => (answers[f.id] || "").trim()).length;
  const complete = filled === day.fields.length;
  const output = renderOutput(day.finalize, answers);
  const progress = { ...props.progress, [day.n]: { answers, completed: done } };

  async function finish() {
    window.clearTimeout(timer.current);
    setSave({ state: "saving" });
    const err = await saveDay(day.n, answers, true);
    if (err) return setSave({ state: "error", msg: err });
    dirty.current = false;
    setDone(true);
    setSave({ state: "saved" });
    setCompleting(true);
    // Um instante para o "concluído" ser visto — depois, o próximo dia.
    window.setTimeout(() => router.push(day.n < props.total ? `/build/dia/${day.n + 1}` : "/build/score"), 520);
  }

  async function saveNow() {
    window.clearTimeout(timer.current);
    setSave({ state: "saving" });
    const err = await saveDay(day.n, answers, done);
    dirty.current = false;
    setSave(err ? { state: "error", msg: err } : { state: "saved" });
  }

  const route = props.route ? ROUTES[props.route] : null;
  const hasWork = Object.values(props.initial).some((v) => v.trim());

  // Leva direto ao trabalho: útil no mobile, onde o contexto vem antes dos campos.
  function goToFirstField() {
    const el = document.getElementById(`f-${day.fields[0].id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus({ preventScroll: true });
  }

  return (
    <Shell back={{ href: "/build", label: "Seu build" }} progress={progress} currentDay={day.n}>
      {day.n === 1 && (
        <div className="kickoff enter">
          <span className="kickoff__lead">Agora começou.</span>
          {route && (
            <span className="routebadge">
              <span className="routebadge__code num">ROTA {route.code}</span>
              <span>{route.name}</span>
            </span>
          )}
        </div>
      )}

      <header className="dayhead">
        <span className="micro enter">
          {day.code} — {day.name}
        </span>
        <h1 className="h1 dayhead__title enter" style={{ "--i": 1 } as CSSProperties}>
          {day.title}
        </h1>
        <p className="lead enter" style={{ "--i": 2 } as CSSProperties}>
          {day.objective}
        </p>
        <p className="dayhead__meta enter" style={{ "--i": 3 } as CSSProperties}>
          <span>
            Dia <span className="num">{day.n}</span> de <span className="num">{props.total}</span>
          </span>
          <span>
            Entregável: <strong>{day.outputLabel}</strong>
          </span>
          {done && (
            <span className="dayhead__done">
              <Tick className="dayhead__tick" /> Concluído
            </span>
          )}
        </p>
      </header>

      <div className="daygrid">
        {/* 01 — CONTEXTO */}
        <aside className="context">
          <details className="context__box" open={!hasWork || undefined}>
            <summary>
              <span className="step">01 · Entenda</span>
              <span className="context__toggle" aria-hidden />
            </summary>
            <div className="context__text">
              {day.n === 1 && route && (
                <p className="context__route">
                  Sua rota pelo quiz: <strong>{route.name}</strong>. {route.statement}
                </p>
              )}
              {day.understand.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </details>
        </aside>

        <div className="work">
          {/* 02 — WORKSPACE */}
          <section className="workspace" aria-labelledby="ws-title">
            <header className="work__head">
              <span className="step" id="ws-title">
                02 · Faça
              </span>
              <span className="work__count num" aria-live="polite">
                {filled}/{day.fields.length}
              </span>
            </header>
            <div className="fieldset">
              {day.fields.map((f, i) => (
                <FieldInput
                  key={f.id}
                  field={f}
                  index={i}
                  value={answers[f.id] || ""}
                  hint={day.n === 1 && f.id === "direcao" && props.example ? props.example : f.hint}
                  onChange={(v) => update(f.id, v)}
                />
              ))}
            </div>
          </section>

          {/* 03 — ARTEFATO */}
          <section className="finalize" aria-labelledby="out-title">
            <span className="step" id="out-title">
              03 · Finalize
            </span>
            <Artifact
              title={day.outputLabel}
              sealed={complete}
              state={complete ? "Artefato construído" : `Em construção · ${filled}/${day.fields.length}`}
              action={<CopyButton text={output} />}
            >
              <pre className="artifact__body">{output}</pre>
            </Artifact>
          </section>

          {/* FERRAMENTAS */}
          {day.tools.length > 0 && (
            <section className="tools" aria-labelledby="tools-title">
              <span className="step" id="tools-title">
                Ferramentas
              </span>
              <ul className="tools__list">
                {day.tools.map((t) => (
                  <li key={t.title}>
                    <details className="tool">
                      <summary>
                        <span>{t.title}</span>
                        <span className="tool__sign" aria-hidden />
                      </summary>
                      <pre>{t.body}</pre>
                      <div className="tool__foot">
                        <CopyButton text={t.body} />
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <nav className="daynav" aria-label="Dias">
            {day.n > 1 ? (
              <Link className="btn btn--quiet" href={`/build/dia/${day.n - 1}`}>
                ← DAY 0{day.n - 1}
              </Link>
            ) : (
              <span />
            )}
            {day.n < props.total ? (
              <Link className="btn btn--quiet" href={`/build/dia/${day.n + 1}`}>
                DAY 0{day.n + 1} →
              </Link>
            ) : (
              <Link className="btn btn--quiet" href="/build/score">
                Build Score →
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Barra de ação: sempre à mão, com o estado de salvamento */}
      <div className="actionbar">
        <div className="actionbar__inner wrap">
          <span className="savestate" data-state={save.state} aria-live="polite">
            <span key={save.state}>
              {save.state === "saving"
                ? "Salvando…"
                : save.state === "saved"
                  ? "Salvo"
                  : save.state === "error"
                    ? save.msg
                    : hasWork || filled
                      ? "Salvamento automático"
                      : (
                          <button className="savestate__go" onClick={goToFirstField}>
                            Comece pelo campo 01 ↓
                          </button>
                        )}
            </span>
          </span>
          <div className="actionbar__btns">
            <button className="btn btn--ghost actionbar__save" onClick={saveNow}>
              Salvar
            </button>
            <button
              className={`btn btn--primary actionbar__done${completing ? " is-done" : ""}`}
              onClick={finish}
              disabled={filled === 0 || completing}
            >
              {completing ? (
                <>
                  <Tick className="actionbar__tick" /> {day.code} concluído
                </>
              ) : (
                <>
                  Concluir {day.code} <Arrow />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function FieldInput(props: { field: Field; index: number; value: string; hint?: string; onChange: (v: string) => void }) {
  const { field, value } = props;
  const ref = useRef<HTMLTextAreaElement>(null);
  const id = `f-${field.id}`;

  // Cresce com o texto: o campo é uma folha, não uma caixa com barra de rolagem.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <div className={`fld${value.trim() ? " is-filled" : ""}`}>
      <label className="fld__head" htmlFor={id}>
        <span className="fld__idx num">{String(props.index + 1).padStart(2, "0")}</span>
        <span className="fld__label">{field.label}</span>
        <Tick className="fld__tick" />
      </label>
      <div className="fld__control">
        <textarea
          ref={ref}
          id={id}
          className="fld__input"
          rows={field.multiline ? 3 : 1}
          value={value}
          onChange={(e) => props.onChange(e.target.value)}
          aria-describedby={props.hint ? `${id}-hint` : undefined}
        />
        <span className="fld__line" aria-hidden />
      </div>
      {props.hint && (
        <p className="fld__hint" id={`${id}-hint`}>
          {props.hint}
        </p>
      )}
    </div>
  );
}
