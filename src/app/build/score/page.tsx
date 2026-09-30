"use client";

import Link from "next/link";
import { useState } from "react";
import { AreaFallback, Shell, useArea } from "@/components/area";
import { MENTORSHIP_URL } from "@/config";
import { DAYS, LEVELS, SCORE_QUESTIONS, computeLevel, type Level } from "@/lib/build";
import { saveScore } from "@/lib/store";

const BUILT = ["direção", "problema", "oferta", "MVP definido", "posicionamento", "distribuição", "oferta no mercado"];

export default function ScorePage() {
  const { state } = useArea();
  const [yes, setYes] = useState<(boolean | null)[]>(SCORE_QUESTIONS.map(() => null));
  const [result, setResult] = useState<{ score: number; level: Level } | null>(null);
  const [err, setErr] = useState("");

  if (state.status !== "ready") return <AreaFallback state={state} />;

  const answered = yes.every((v) => v !== null);
  const pendingDay = DAYS.find((d) => !state.progress[d.n]?.completed);

  async function submit() {
    const bools = yes.map(Boolean);
    const r = computeLevel(bools);
    const e = await saveScore(r.score, r.level, bools);
    if (e) return setErr(e);
    setResult(r);
  }

  if (result) {
    const lv = LEVELS[result.level];
    const got = BUILT.filter((_, i) => yes[i]);
    return (
      <Shell back={{ href: "/build", label: "Seu build" }}>
        <span className="micro">{result.level === 3 ? "BUILD COMPLETE" : "BUILD SCORE"}</span>
        <h1 className="score__level">{lv.code}</h1>
        <p className="score__title">{lv.title}</p>
        <p className="lead">{lv.text}</p>

        {got.length > 0 && (
          <>
            <h2 className="day__step score__have">Você já tem</h2>
            <ul className="checks">
              {got.map((g) => (
                <li key={g}>✓ {g}</li>
              ))}
            </ul>
          </>
        )}

        <div className="mentor">
          <p>
            Existe uma diferença entre ter algo construído e construir uma operação que cresce.
            {result.level === 3 ? " Quer fazer isso acompanhado?" : ""}
          </p>
          {result.level === 3 ? (
            MENTORSHIP_URL ? (
              <a className="btn btn--primary btn--block" href={MENTORSHIP_URL}>
                Aplicar para a ALPHA Mentorship
              </a>
            ) : (
              <p className="lead">A aplicação para a ALPHA Mentorship abre em breve. Você será avisado pelo WhatsApp.</p>
            )
          ) : (
            <>
              <Link className="btn btn--primary btn--block" href={pendingDay ? `/build/dia/${pendingDay.n}` : "/build"}>
                {pendingDay ? `Continuar no ${pendingDay.code} →` : "Voltar ao build"}
              </Link>
              {MENTORSHIP_URL && (
                <a className="btn btn--ghost btn--block" href={MENTORSHIP_URL}>
                  Conhecer a ALPHA Mentorship
                </a>
              )}
            </>
          )}
        </div>
      </Shell>
    );
  }

  return (
    <Shell back={{ href: "/build", label: "Seu build" }}>
      <span className="micro">BUILD SCORE</span>
      <h1 className="area__title">No final, você sabe onde está.</h1>
      <p className="lead">7 critérios objetivos. Responda com honestidade — é um retrato, não uma prova.</p>
      {state.member.level && (
        <p className="area__route">
          Último resultado: <strong>{LEVELS[state.member.level].code}</strong>. Responda de novo para atualizar.
        </p>
      )}

      <ol className="yesno">
        {SCORE_QUESTIONS.map((q, i) => (
          <li key={q}>
            <span>{q}</span>
            <div className="yesno__opts" role="group" aria-label={q}>
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  className={`yesno__btn${yes[i] === val ? " is-selected" : ""}`}
                  aria-pressed={yes[i] === val}
                  onClick={() => setYes((y) => y.map((v, j) => (j === i ? val : v)))}
                >
                  {val ? "Sim" : "Não"}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ol>
      {err && <p className="form__error">{err}</p>}
      <button className="btn btn--primary btn--block" onClick={submit} disabled={!answered}>
        Ver meu Build Score
      </button>
    </Shell>
  );
}
