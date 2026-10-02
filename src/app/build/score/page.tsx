"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { AreaFallback, BuildStack, FirstMarketTest, Shell, useArea } from "@/components/area";
import { Arrow, screenTransition } from "@/components/ui";
import { MENTORSHIP_URL } from "@/config";
import { LEVELS, SCORE_QUESTIONS, computeLevel, type Level } from "@/lib/build";
import { saveScore } from "@/lib/store";

const CRITERIA = ["Direção", "Problema", "Oferta", "MVP", "Posição", "Distribuição", "Mercado"];
const SHOUT: Record<Level, string> = { 1: "You started.", 2: "You built.", 3: "You shipped." };

export default function ScorePage() {
  const { state } = useArea();
  const [yes, setYes] = useState<(boolean | null)[]>(SCORE_QUESTIONS.map(() => null));
  const [result, setResult] = useState<{ score: number; level: Level } | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (state.status !== "ready") return <AreaFallback state={state} />;

  const answered = yes.filter((v) => v !== null).length;
  const pendingDay = state.content.days.find((d) => !state.progress[d.n]?.completed);

  async function submit() {
    setBusy(true);
    const bools = yes.map(Boolean);
    const r = computeLevel(bools);
    const e = await saveScore(r.score, r.level, bools);
    setBusy(false);
    if (e) return setErr(e);
    screenTransition(() => setResult(r));
    window.scrollTo({ top: 0 });
  }

  if (result) {
    const lv = LEVELS[result.level];
    return (
      <Shell back={{ href: "/build", label: "Seu build" }} progress={state.progress}>
        <section className="verdict">
          <span className="micro enter">{result.level === 3 ? "BUILD COMPLETE" : "BUILD SCORE"}</span>
          <h1 className="verdict__level">
            <span className="mask" style={{ "--i": 0 } as CSSProperties}>
              <span>
                BUILD <span className="num">0{result.level}</span>
              </span>
            </span>
          </h1>
          <p className="verdict__shout enter" style={{ "--i": 3 } as CSSProperties}>
            {SHOUT[result.level]}
          </p>
          <p className="h3 enter" style={{ "--i": 4 } as CSSProperties}>
            {lv.title}
          </p>
          <p className="lead enter" style={{ "--i": 5 } as CSSProperties}>
            {lv.text}
          </p>

          <div className="meter7 enter" style={{ "--i": 6 } as CSSProperties}>
            <ol className="meter7__cells" aria-label={`${result.score} de 7 critérios`}>
              {CRITERIA.map((c, i) => (
                <li key={c} className={yes[i] ? "is-on" : ""} style={{ "--i": i } as CSSProperties}>
                  <span className="meter7__bar" aria-hidden />
                  <span className="meter7__label">
                    {c}
                    <span className="sr-only">{yes[i] ? ": sim" : ": não"}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="meter7__sum num">{result.score}/7 critérios</p>
          </div>

          <div className="mentor enter" style={{ "--i": 7 } as CSSProperties}>
            <p className="h3">
              Existe uma diferença entre ter algo construído e construir uma operação que cresce.
              {result.level === 3 ? " Quer fazer isso acompanhado?" : ""}
            </p>
            {result.level === 3 ? (
              MENTORSHIP_URL ? (
                <a className="btn btn--primary btn--lg" href={MENTORSHIP_URL}>
                  Aplicar para a ALPHA Mentorship <Arrow />
                </a>
              ) : (
                <p className="body">A aplicação para a ALPHA Mentorship abre em breve. Você será avisado pelo WhatsApp.</p>
              )
            ) : (
              <div className="mentor__btns">
                <Link className="btn btn--primary btn--lg" href={pendingDay ? `/build/dia/${pendingDay.n}` : "/build"}>
                  {pendingDay ? `Continuar no ${pendingDay.code}` : "Voltar ao build"} <Arrow />
                </Link>
                {MENTORSHIP_URL && (
                  <a className="btn btn--ghost btn--lg" href={MENTORSHIP_URL}>
                    Conhecer a ALPHA Mentorship
                  </a>
                )}
              </div>
            )}
          </div>

          <FirstMarketTest progress={state.progress} nome={state.member.nome} />

          <BuildStack days={state.content.days} progress={state.progress} />
        </section>
      </Shell>
    );
  }

  return (
    <Shell back={{ href: "/build", label: "Seu build" }} progress={state.progress}>
      <header className="dayhead">
        <span className="micro enter">BUILD SCORE</span>
        <h1 className="h1 dayhead__title enter" style={{ "--i": 1 } as CSSProperties}>
          No final, você sabe onde está.
        </h1>
        <p className="lead enter" style={{ "--i": 2 } as CSSProperties}>
          7 critérios objetivos. Responda com honestidade — é um retrato, não uma prova.
        </p>
        {state.member.level && (
          <p className="dayhead__meta enter" style={{ "--i": 3 } as CSSProperties}>
            <span>
              Último resultado: <strong>{LEVELS[state.member.level].code}</strong>. Responda de novo para atualizar.
            </span>
          </p>
        )}
      </header>

      <ol className="audit">
        {SCORE_QUESTIONS.map((q, i) => (
          <li
            key={q}
            className={`audit__row enter${yes[i] !== null ? " is-answered" : ""}`}
            style={{ "--i": 3 + i } as CSSProperties}
          >
            <span className="audit__idx num">{String(i + 1).padStart(2, "0")}</span>
            <span className="audit__q">{q}</span>
            <div className="seg" role="radiogroup" aria-label={q}>
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  role="radio"
                  aria-checked={yes[i] === val}
                  className={`seg__btn${yes[i] === val ? " is-selected" : ""}`}
                  onClick={() => setYes((y) => y.map((v, j) => (j === i ? val : v)))}
                >
                  {val ? "Sim" : "Não"}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>

      {err && (
        <p className="alert" role="alert">
          {err}
        </p>
      )}
      <div className="audit__submit">
        <span className="caption num">{answered}/7 respondidas</span>
        <button className="btn btn--primary btn--lg" onClick={submit} disabled={answered < 7 || busy}>
          {busy ? "Calculando…" : "Ver meu Build Score"} {!busy && <Arrow />}
        </button>
      </div>
    </Shell>
  );
}
