"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AreaFallback, Shell, useArea } from "@/components/area";
import { Arrow, Artifact, CopyButton, FieldNote, Reveal, Tick, TwoDoors } from "@/components/ui";
import { renderOutput, type Answers, type Day, type Field, type Reply, type Script, type Step } from "@/lib/build";
import { ROUTES, type RouteKey } from "@/lib/quiz";
import { saveDay, type Progress } from "@/lib/store";

const AUTOSAVE_MS = 1200;
// Commit: barra mínima (= --d-slow) enquanto o save real roda, depois COMMITTED e o próximo dia. ~1.1s no total.
const COMMIT_MIN_MS = 640;
const COMMITTED_MS = 220;
const NEXT_MS = 240;
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

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
      nextName={state.content.days.find((d) => d.n === n + 1)?.name}
      progress={state.progress}
      example={state.member.route ? state.content.day01Examples[state.member.route] : undefined}
      initial={saved?.answers ?? {}}
      initiallyDone={!!saved?.completed}
      route={state.member.route}
    />
  );
}

type SaveState = "idle" | "saving" | "saved" | "error";
type CommitPhase = "idle" | "committing" | "committed" | "next" | "error";

function DayView(props: {
  day: Day;
  total: number;
  nextName?: string;
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
  const [commit, setCommit] = useState<CommitPhase>("idle");
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
    if (commit === "error") setCommit("idle");
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  const filled = day.fields.filter((f) => (answers[f.id] || "").trim()).length;
  const complete = filled === day.fields.length;
  const output = renderOutput(day.finalize, answers);
  const progress = { ...props.progress, [day.n]: { answers, completed: done } };

  // COMMIT BUILD: só mostra COMMITTED depois do save real; erro volta para a barra com "tentar de novo".
  async function finish() {
    window.clearTimeout(timer.current);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setCommit("committing");
    setSave({ state: "saving" });
    const saving = saveDay(day.n, answers, true).catch(() => "Não foi possível salvar. Tente de novo.");
    const [err] = await Promise.all([saving, wait(reduced ? 0 : COMMIT_MIN_MS)]);
    if (err) {
      setCommit("error");
      return setSave({ state: "error", msg: err });
    }
    dirty.current = false;
    setDone(true);
    setSave({ state: "saved" });
    setCommit("committed");
    await wait(reduced ? 400 : COMMITTED_MS);
    setCommit("next");
    await wait(reduced ? 400 : NEXT_MS);
    router.push(day.n < props.total ? `/build/dia/${day.n + 1}` : "/build/score");
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

  // Leva direto ao trabalho: a leitura vem antes dos campos.
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
      {day.n === 7 && (
        <div className="kickoff kickoff--doors enter">
          <span className="kickoff__lead">Hoje você entra pela porta vazia.</span>
          <TwoDoors className="kickoff__doors" />
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

      <article className="lesson">
        {/* 01 — THE IDEA */}
        <Chapter n={1} label="The idea">
          <p className="lesson__idea">{day.idea}</p>
          {day.n === 1 && route && (
            <p className="lesson__route">
              Sua rota pelo quiz: <strong>{route.name}</strong>. {route.statement}
            </p>
          )}
        </Chapter>

        {/* 02 — THE PRINCIPLE */}
        <Chapter n={2} label="The principle">
          <div className="prose">
            {day.principle.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </Chapter>

        {/* 03 — THE METHOD (+ roteiros e respostas: ensinados aqui, não escondidos no arsenal) */}
        <Chapter n={3} label="The method">
          <ol className="method">
            {day.method.map((s, i) => (
              <MethodStep key={s.title} step={s} index={i} route={props.route} />
            ))}
          </ol>
          {day.scripts?.map((sc) => <ScriptView key={sc.title} script={sc} />)}
          {day.replies && day.replies.length > 0 && <RepliesView replies={day.replies} />}
        </Chapter>

        {/* 04 — SEE IT */}
        <Chapter n={4} label="See it">
          <SeeIt seeIt={day.seeIt} route={props.route} />
        </Chapter>

        <FieldNote>{day.fieldNote}</FieldNote>

        {/* 05 — YOUR MOVE */}
        <Chapter n={5} label="Your move">
          <section className="workspace" aria-label="Your move">
            <header className="work__head">
              <span className="caption">Preencha com o seu caso. Salva sozinho.</span>
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
        </Chapter>

        {/* 06 — YOUR OUTPUT */}
        <Chapter n={6} label="Your output">
          <div className="finalize">
            <Artifact
              title={day.outputLabel}
              sealed={complete}
              state={complete ? "Artefato construído" : `Em construção · ${filled}/${day.fields.length}`}
              action={<CopyButton text={output} />}
            >
              <pre className="artifact__body">{output}</pre>
            </Artifact>
          </div>
        </Chapter>

        {/* 07 — NEXT MOVE */}
        <Chapter n={7} label="Next move">
          <p className="nextmove__action">{day.nextMove.action}</p>
          <p className="nextmove__text">{day.nextMove.text}</p>
        </Chapter>

        {/* ARSENAL — material de consulta */}
        {day.tools.length > 0 && (
          <section className="tools" aria-labelledby="tools-title">
            <span className="label" id="tools-title">
              Arsenal
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
      </article>

      {/* Barra de ação: sempre à mão, com o estado de salvamento */}
      <div className="actionbar">
        <div className="actionbar__inner wrap">
          {commit === "committing" || commit === "committed" || commit === "next" ? (
            <div className="commit" data-phase={commit} role="status" aria-live="polite">
              <span className="commit__bar" aria-hidden>
                <i />
              </span>
              <span className="commit__state">
                <span key={commit}>
                  {commit === "committing"
                    ? "Committing…"
                    : commit === "committed"
                      ? "Committed"
                      : day.n < props.total
                        ? `DAY 0${day.n + 1} → ${props.nextName ?? ""}`
                        : "Build Score →"}
                </span>
              </span>
              <span className="commit__day">
                {day.code} · {day.name}
              </span>
            </div>
          ) : (
            <>
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
                                Ir ao exercício ↓
                              </button>
                            )}
                </span>
              </span>
              <div className="actionbar__btns">
                <button className="btn btn--ghost actionbar__save" onClick={saveNow}>
                  Salvar
                </button>
                <button className="btn btn--primary actionbar__done" onClick={finish} disabled={filled === 0}>
                  {commit === "error" ? "Tentar de novo" : `Concluir ${day.code}`} <Arrow />
                </button>
              </div>
            </>
          )}
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

// ---------- LIÇÃO ----------

const pad = (n: number) => String(n).padStart(2, "0");
const ROUTE_ORDER: RouteKey[] = ["servico", "produto", "bastidor", "distribuicao"];

function Chapter(props: { n: number; label: string; children: ReactNode }) {
  return (
    <Reveal as="section" className="ch">
      <span className="ch__num num" aria-hidden>
        {pad(props.n)}
      </span>
      <div className="ch__body">
        <h2 className="label ch__label">{props.label}</h2>
        {props.children}
      </div>
    </Reveal>
  );
}

function MethodStep({ step, index, route }: { step: Step; index: number; route: RouteKey | null }) {
  const mine = route && step.byRoute ? route : null;
  const others = step.byRoute ? ROUTE_ORDER.filter((k) => k !== mine) : [];
  return (
    <li className="method__step">
      <span className="method__idx num">{pad(index + 1)}</span>
      <div className="method__body">
        <h3 className="method__title">{step.title}</h3>
        <p className="method__text">{step.text}</p>
        {step.points && (
          <ul className="method__points">
            {step.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        {mine && step.byRoute && (
          <div className="byroute">
            <span className="byroute__label">Na sua rota — {ROUTES[mine].name}</span>
            <p>{step.byRoute[mine]}</p>
          </div>
        )}
        {step.byRoute && (
          <details className="more">
            <summary>{mine ? "Nas outras rotas" : "Por rota"}</summary>
            <dl className="more__list">
              {others.map((k) => (
                <div key={k}>
                  <dt>{ROUTES[k].name}</dt>
                  <dd>{step.byRoute![k]}</dd>
                </div>
              ))}
            </dl>
          </details>
        )}
        {step.after && <p className="method__after">{step.after}</p>}
      </div>
    </li>
  );
}

const WHO = { voce: "Você", cliente: "Cliente", tempo: "" } as const;

function ScriptView({ script }: { script: Script }) {
  const text = script.lines
    .map((l) => (l.who === "tempo" ? `— ${l.text} —` : `${WHO[l.who].toUpperCase()}: ${l.text}`))
    .join("\n\n");
  return (
    <section className="script">
      <header className="script__head">
        <h3 className="script__title">{script.title}</h3>
        <CopyButton text={text} />
      </header>
      {script.intro && <p className="script__intro">{script.intro}</p>}
      <ol className="script__lines">
        {script.lines.map((l, i) =>
          l.who === "tempo" ? (
            <li key={i} className="script__time">
              {l.text}
            </li>
          ) : (
            <li key={i} className={`script__line is-${l.who}`}>
              <span className="script__who">{WHO[l.who]}</span>
              <div>
                <p className="script__say">{l.text}</p>
                {l.note && <p className="script__note">{l.note}</p>}
              </div>
            </li>
          ),
        )}
      </ol>
    </section>
  );
}

function RepliesView({ replies }: { replies: Reply[] }) {
  return (
    <section className="replies">
      <h3 className="script__title">Quando a pessoa diz…</h3>
      <dl className="replies__list">
        {replies.map((r) => (
          <div key={r.says} className="reply">
            <dt className="reply__says">“{r.says}”</dt>
            <dd>
              <p className="reply__answer">{r.answer}</p>
              <p className="reply__why">{r.why}</p>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function SeeIt({ seeIt, route }: { seeIt: Day["seeIt"]; route: RouteKey | null }) {
  const main = seeIt.examples.find((e) => e.route === route) ?? seeIt.examples[0];
  const others = seeIt.examples.filter((e) => e !== main);
  const pair = (e: typeof main) => (
    <div className="seeit">
      <div className="seeit__side is-before">
        <span className="seeit__tag">{seeIt.before}</span>
        <p>{e.before}</p>
      </div>
      <div className="seeit__side is-after">
        <span className="seeit__tag">{seeIt.after}</span>
        <p>{e.after}</p>
      </div>
      <p className="seeit__why">{e.why}</p>
    </div>
  );
  return (
    <>
      {route && main.route === route && <span className="byroute__label">Na sua rota — {ROUTES[route].name}</span>}
      {pair(main)}
      {others.length > 0 && (
        <details className="more">
          <summary>Nas outras rotas</summary>
          {others.map((e) => (
            <div key={e.route} className="more__ex">
              <span className="byroute__label">{ROUTES[e.route].name}</span>
              {pair(e)}
            </div>
          ))}
        </details>
      )}
    </>
  );
}
