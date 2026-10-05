"use client";

// /v2 — Fase 2: HERO + BUILD CORE + PRIMEIRA TRANSIÇÃO. Protótipo de direção visual.
// O core fica fixo (sticky) enquanto o hero dá lugar ao problema: PLANTA → ACÚMULO.
// Sem sequestro de scroll: o scroll é nativo; só a posição da seção vira progresso.

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { OFFER } from "@/config";
import { Arrow, Reveal } from "../ui";
import { BuildCore, type CoreApi } from "./BuildCore";

const CONSUMED = ["Cursos.", "Vídeos.", "Threads.", "Prompts.", "Ferramentas.", "Ideias."];

export function LandingV2() {
  const core = useRef<CoreApi>(null);
  const problem = useRef<HTMLElement>(null);
  const [loose, setLoose] = useState(false);

  useEffect(() => {
    const el = problem.current?.querySelector("h2");
    if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = -1;
    const read = () => {
      const vh = innerHeight;
      const top = el.getBoundingClientRect().top;
      // Ancorado no título do problema: começa quando ele entra pela base e termina a ~45% da tela.
      let p = Math.min(1, Math.max(0, (vh - top) / (vh * 0.55)));
      if (reduced) p = p > 0.5 ? 1 : 0; // sem interpolação: troca de estado direta
      if (p === last) return;
      last = p;
      core.current?.setProgress(p);
      setLoose(p > 0.5);
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
        <div className="v2-pin">
          <BuildCore ref={core} className="v2-core" />
          <p className="micro v2-readout" aria-hidden>
            00 / 07 — {loose ? "ACÚMULO" : "PLANTA"}
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
      </div>

      <footer className="v2-end wrap">
        <p className="caption">Fim do protótipo — Fase 2 (hero + BUILD CORE + primeira transição).</p>
        <Link className="btn btn--quiet" href="/">
          Ver a landing atual
        </Link>
      </footer>
    </div>
  );
}
