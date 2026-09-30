"use client";

import Link from "next/link";
import { AreaFallback, Shell, useArea } from "@/components/area";
import { LEVELS } from "@/lib/build";
import { ROUTES } from "@/lib/quiz";

export default function BuildHome() {
  const { state } = useArea();
  if (state.status !== "ready") return <AreaFallback state={state} />;

  const { member, progress } = state;
  const DAYS = state.content.days;
  const done = DAYS.filter((d) => progress[d.n]?.completed).length;
  const next = DAYS.find((d) => !progress[d.n]?.completed);
  const route = member.route ? ROUTES[member.route] : null;

  return (
    <Shell>
      <span className="micro">YOUR BUILD</span>
      <h1 className="area__title">{member.nome ? `${member.nome}, seu 7-Day Build.` : "Seu 7-Day Build."}</h1>
      <p className="lead">Transforme uma direção em algo real.</p>
      {route && (
        <p className="area__route">
          Rota <strong>{route.name}</strong> · {route.model}
        </p>
      )}

      <div className="meter">
        <div className="meter__label">
          <span>
            {done} / {DAYS.length} dias concluídos
          </span>
        </div>
        <div className="bar">
          <div className="bar__fill" style={{ transform: `scaleX(${done / DAYS.length})` }} />
        </div>
      </div>

      {next ? (
        <Link className="next" href={`/build/dia/${next.n}`}>
          <span className="next__eyebrow">{done === 0 ? "Comece por aqui" : "Continue"}</span>
          <span className="next__title">
            {next.code} — {next.name}
          </span>
          <span className="next__text">{next.objective}</span>
          <span className="next__go">{progress[next.n] ? "Continuar →" : "Começar →"}</span>
        </Link>
      ) : (
        <Link className="next" href="/build/score">
          <span className="next__eyebrow">7 de 7</span>
          <span className="next__title">BUILD SCORE</span>
          <span className="next__text">Você concluiu os 7 dias. Avalie sua construção.</span>
          <span className="next__go">{member.level ? "Ver meu Build Score →" : "Fazer o Build Score →"}</span>
        </Link>
      )}

      <ol className="daylist">
        {DAYS.map((d) => {
          const p = progress[d.n];
          const status = p?.completed ? "✓" : d.n === next?.n ? "→" : "—";
          return (
            <li key={d.n}>
              <Link href={`/build/dia/${d.n}`} className={p?.completed ? "is-done" : d.n === next?.n ? "is-next" : ""}>
                <span className="daylist__code">
                  {d.code} — {d.name}
                </span>
                <span className="daylist__status" aria-label={p?.completed ? "concluído" : "pendente"}>
                  {status}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <Link className="scorecard" href="/build/score">
        <span className="scorecard__label">BUILD SCORE</span>
        <span className="scorecard__value">
          {member.level ? `${LEVELS[member.level].code} — ${LEVELS[member.level].title}` : "Em progresso"}
        </span>
      </Link>
    </Shell>
  );
}
