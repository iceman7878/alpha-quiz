"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { AreaFallback, DayRail, Shell, useArea } from "@/components/area";
import { Arrow, Tick } from "@/components/ui";
import { LEVELS } from "@/lib/build";
import { ROUTES } from "@/lib/quiz";

export default function BuildHome() {
  const { state } = useArea();
  if (state.status !== "ready") return <AreaFallback state={state} />;

  const { member, progress } = state;
  const days = state.content.days;
  const done = days.filter((d) => progress[d.n]?.completed).length;
  const next = days.find((d) => !progress[d.n]?.completed);
  const route = member.route ? ROUTES[member.route] : null;
  const started = !!(next && progress[next.n]);

  return (
    <Shell>
      <section className="home__head">
        <div>
          <span className="micro enter">YOUR BUILD</span>
          <h1 className="h1 home__title enter" style={{ "--i": 1 } as CSSProperties}>
            {member.nome ? `${member.nome}, seu 7-Day Build.` : "Seu 7-Day Build."}
          </h1>
          <p className="lead enter" style={{ "--i": 2 } as CSSProperties}>
            Transforme uma direção em algo real.
          </p>
          {route && (
            <p className="routebadge enter" style={{ "--i": 3 } as CSSProperties}>
              <span className="routebadge__code num">ROTA {route.code}</span>
              <span>{route.name}</span>
            </p>
          )}
        </div>
        <div className="home__count enter" style={{ "--i": 2 } as CSSProperties} aria-label={`${done} de 7 dias concluídos`}>
          <span className="home__num num">{String(done).padStart(2, "0")}</span>
          <span className="home__of">
            / 07
            <br />
            dias concluídos
          </span>
        </div>
      </section>

      <div className="home__rail enter" style={{ "--i": 3 } as CSSProperties}>
        <DayRail progress={progress} labels />
      </div>

      {next ? (
        <Link className="nextmove enter" style={{ "--i": 4 } as CSSProperties} href={`/build/dia/${next.n}`}>
          <span className="label">{done === 0 ? "Comece por aqui" : started ? "Continue de onde parou" : "Próximo"}</span>
          <span className="nextmove__day">
            <span className="num">{next.code}</span> — {next.name}
          </span>
          <span className="nextmove__title">{next.title}</span>
          <span className="body">{next.objective}</span>
          <span className="btn btn--primary nextmove__go">
            {started ? "Continuar" : "Começar"} {next.code} <Arrow />
          </span>
        </Link>
      ) : (
        <Link className="nextmove enter" style={{ "--i": 4 } as CSSProperties} href="/build/score">
          <span className="label">7 de 7 · build concluído</span>
          <span className="nextmove__day">BUILD SCORE</span>
          <span className="nextmove__title">Avalie sua construção.</span>
          <span className="body">7 critérios objetivos. Um retrato de onde você está — e do próximo movimento.</span>
          <span className="btn btn--primary nextmove__go">
            {member.level ? "Ver meu Build Score" : "Fazer o Build Score"} <Arrow />
          </span>
        </Link>
      )}

      <section className="seq" aria-label="Sequência">
        <span className="label">Sequência</span>
        <ol className="seq__list">
          {days.map((d, i) => {
            const p = progress[d.n];
            const isNext = d.n === next?.n;
            const status = p?.completed ? "done" : isNext ? "next" : p ? "open" : "todo";
            return (
              <li key={d.n} className="enter" style={{ "--i": 5 + i } as CSSProperties}>
                <Link href={`/build/dia/${d.n}`} className={`seq__row is-${status}`}>
                  <span className="seq__code num">{d.code}</span>
                  <span className="seq__name">{d.name}</span>
                  <span className="seq__out">{d.outputLabel}</span>
                  <span className="seq__status">
                    {status === "done" ? (
                      <>
                        <Tick className="seq__tick" /> <span className="sr-only">concluído</span>
                      </>
                    ) : status === "next" ? (
                      "Agora"
                    ) : status === "open" ? (
                      "Em andamento"
                    ) : (
                      ""
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <Link className="scorerow" href="/build/score">
        <span className="label">Build Score</span>
        <span className="scorerow__value">
          {member.level ? (
            <>
              <span className="scorerow__code">{LEVELS[member.level].code}</span> {LEVELS[member.level].title}
            </>
          ) : (
            "Em progresso — disponível no DAY 07"
          )}
        </span>
        <span aria-hidden>→</span>
      </Link>
    </Shell>
  );
}
