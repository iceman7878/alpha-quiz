"use client";

// /v2 — Fases 2 e 3: HERO + BUILD CORE + PLANTA → ACÚMULO → CONSTRUÇÃO → COMPLETION.
// Protótipo de direção visual. O core fica fixo (sticky) enquanto as seções passam.
// Sem sequestro de scroll: o scroll é nativo; só a posição das seções vira progresso.

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { OFFER } from "@/config";
import { Arrow, Reveal } from "../ui";
import { BuildCore, type CoreApi } from "./BuildCore";
import { STAGES, lockedAt, phaseAt, type Phase } from "./core-timeline";

const CONSUMED = ["Cursos.", "Vídeos.", "Threads.", "Prompts.", "Ferramentas.", "Ideias."];

export function LandingV2() {
  const core = useRef<CoreApi>(null);
  const problem = useRef<HTMLElement>(null);
  const build = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("PLANTA");
  const [locked, setLocked] = useState(0);

  useEffect(() => {
    const el = problem.current?.querySelector("h2");
    const run = build.current;
    if (!el || !run) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = -1;
    const read = () => {
      const vh = innerHeight;
      const top = el.getBoundingClientRect().top;
      // Ancorado no título do problema: começa quando ele entra pela base e termina a ~45% da tela.
      let p = Math.min(1, Math.max(0, (vh - top) / (vh * 0.55)));
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
      setPhase(phaseAt(P));
      setLocked(lockedAt(P));
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
        <section className="v2-problem wrap" ref={problem}>
          <Reveal>
            <span className="label v2-ch">02 — The problem</span>
            <h2 className="v2-h2">Você não precisa de mais informação.</h2>
          </Reveal>
          <ul className="v2-consumed">
            {CONSUMED.map((t, i) => (
              <Reveal as="li" key={t} i={i}>
                {t}
              </Reveal>
            ))}
          </ul>
          <Reveal className="v2-verdict">
            <p className="v2-neq">Consumo acumulado ≠ construção.</p>
            <p className="v2-note">Tudo isso chega em peças. Nenhuma tem a medida da sua oferta.</p>
          </Reveal>
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
        <p className="caption">Fim do protótipo — Fase 3 (hero + BUILD CORE + construção → completion).</p>
        <Link className="btn btn--quiet" href="/">
          Ver a landing atual
        </Link>
      </footer>
    </div>
  );
}
