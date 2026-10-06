"use client";

// /v2 — Fases 2 e 3: HERO + BUILD CORE + PLANTA → ACÚMULO → CONSTRUÇÃO → COMPLETION.
// Protótipo de direção visual. O core fica fixo (sticky) enquanto as seções passam.
// Sem sequestro de scroll: o scroll é nativo; só a posição das seções vira progresso.

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { OFFER } from "@/config";
import { Arrow, Reveal } from "../ui";
import { BuildCore, type CoreApi } from "./BuildCore";
import { STAGES, arrivedAt, lockedAt, phaseAt, type Phase } from "./core-timeline";

const CONSUMED = ["Cursos.", "Vídeos.", "Threads.", "Prompts.", "Ferramentas.", "Ideias."];

export function LandingV2() {
  const core = useRef<CoreApi>(null);
  const problem = useRef<HTMLElement>(null);
  const build = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("PLANTA");
  const [locked, setLocked] = useState(0);
  const [arrived, setArrived] = useState(0);
  const [verdict, setVerdict] = useState(false);

  useEffect(() => {
    const sec = problem.current;
    const run = build.current;
    if (!sec || !run) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = -1;
    const read = () => {
      const vh = innerHeight;
      // Acúmulo: a seção 02 inteira é a trilha (0 → 1). Começa quando ela entra e termina quando
      // a 03 começa a entrar — as peças chegam ao longo de todo o trecho, sem tela parada.
      const s = sec.getBoundingClientRect();
      let p = Math.min(1, Math.max(0, (vh * 0.85 - s.top) / Math.max(1, s.height - vh * 0.15)));
      // Construção: a trilha da seção 03 inteira (menos uma tela) leva de 1 a 3.
      const r = run.getBoundingClientRect();
      const q = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
      if (reduced) p = p > 0.5 ? 1 : 0; // sem interpolação: troca de estado direta
      let P = p + q * 2;
      if (reduced && q > 0) P = q > 0.5 ? 3 : 1;
      if (P === last) return;
      last = P;
      core.current?.setProgress(P);
      // No mobile o objeto desce para o centro durante a construção (só CSS usa).
      pin.current?.style.setProperty("--shift", String(Math.min(1, Math.max(0, (P - 1) / 0.5))));
      pin.current?.style.setProperty("--hero", String(1 - Math.min(1, P / 0.4)));
      setPhase(phaseAt(P));
      setLocked(lockedAt(P));
      setArrived(arrivedAt(P));
      setVerdict(P >= 0.9);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(read);
    };
    read();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, []);

  const cta = (
    <Link className="btn btn--primary btn--lg" href="/">
      Comece seu 7-Day Build <Arrow />
    </Link>
  );

  return (
    <div className="v2">
      <header className="topbar wrap v2-top">
        <span className="wordmark topbar__mark">ALPHA</span>
        <Link className="btn btn--quiet" href="/entrar">
          Já comprou? Entrar
        </Link>
      </header>

      <div className="v2-run">
        {/* Camada fixa do objeto: acompanha hero e problema, depois sai com o scroll. */}
        <div className="v2-pin" ref={pin}>
          <BuildCore ref={core} className="v2-core" />
          <p className="micro v2-readout" aria-hidden>
            {String(locked).padStart(2, "0")} / 07 — {phase === "COMPLETE" ? "BUILD COMPLETE" : phase}
          </p>
        </div>

        {/* ---------- 01 INTERRUPTION ---------- */}
        <section className="v2-hero wrap">
          <span className="micro enter">ALPHA LAUNCH — 7-DAY BUILD</span>
          <h1 className="v2-title">
            <span className="mask" style={{ "--i": 0 } as CSSProperties}>
              <span>Stop consuming.</span>
            </span>
            <span className="mask v2-title__b" style={{ "--i": 1 } as CSSProperties}>
              <span>Start building.</span>
            </span>
          </h1>
          <div className="v2-hero__body">
            <p className="v2-lead enter" style={{ "--i": 4 } as CSSProperties}>
              Construa uma oferta digital pronta para testar no mercado em 7 dias.
            </p>
            <p className="v2-sub enter" style={{ "--i": 5 } as CSSProperties}>
              Não é mais um curso. Um dia, uma construção, um entregável.
            </p>
            <div className="v2-actions enter" style={{ "--i": 6 } as CSSProperties}>
              {cta}
              <p className="v2-terms">
                <span className="num">{OFFER.priceLabel}</span>
                <span>Pagamento único · 3 perguntas para montar sua rota</span>
              </p>
            </div>
          </div>
        </section>

        {/* ---------- 02 THE PROBLEM (primeira transição) ---------- */}
        {/* Cada palavra acende quando a sua peça cai na pilha: o texto e o objeto andam juntos. */}
        <section className="v2-problem" ref={problem}>
          <div className="v2-problem__stick wrap">
            <Reveal>
              <span className="label v2-ch">02 — The problem</span>
              <h2 className="v2-h2">Você não precisa de mais informação.</h2>
            </Reveal>
            <ul className="v2-consumed">
              {CONSUMED.map((t, i) => (
                <li key={t} className={i < arrived ? "is-on" : undefined}>
                  {t}
                </li>
              ))}
            </ul>
            <div className={`v2-verdict${verdict ? " is-on" : ""}`}>
              <p className="v2-neq">Consumo acumulado ≠ construção.</p>
              <p className="v2-note">Tudo isso chega em peças. Nenhuma tem a medida da sua oferta.</p>
            </div>
          </div>
        </section>

        {/* ---------- 03 THE BUILD (segunda transição: construção → completion) ---------- */}
        {/* Trilha de scroll: o texto é mínimo de propósito — quem fala aqui é o objeto. */}
        <section className="v2-build" ref={build}>
          <div className="v2-build__stick wrap">
            <span className="label">03 — The build</span>
            {phase === "COMPLETE" ? (
              <p className="v2-build__line">
                7 days.
                <br />
                One build.
              </p>
            ) : (
              <p className="v2-build__line">
                <span className="num">{String(Math.min(7, locked + 1)).padStart(2, "0")}</span>
                <br />
                <span className="v2-build__dim">{STAGES[Math.min(6, locked)]}</span>
              </p>
            )}
            <p className="v2-note v2-build__note">Uma peça por dia, na medida da sua oferta. Na sétima, o conjunto fecha.</p>
          </div>
        </section>
      </div>

      <footer className="v2-end wrap">
        <p className="caption">Fim do protótipo — Fase 3.5 (hero + BUILD CORE + construção → completion).</p>
        <Link className="btn btn--quiet" href="/">
          Ver a landing atual
        </Link>
      </footer>
    </div>
  );
}
