"use client";

// Abertura do funil. Primeira dobra = decisão (quem vem da DM clica e começa);
// abaixo da dobra, a mecânica DISCOVER → BUILD → SHIP para quem chega pela bio.

import Link from "next/link";
import type { CSSProperties } from "react";
import { Arrow, Reveal } from "../ui";
import { BuildDemo } from "./BuildDemo";

const ACTS = [
  {
    code: "01",
    name: "Discover",
    title: "Descubra sua rota.",
    text: "3 perguntas sobre o que você já tem, como prefere aparecer e o ritmo possível. A ALPHA indica por onde começar.",
  },
  {
    code: "02",
    name: "Build",
    title: "Construa em 7 dias.",
    text: "Cada dia é uma tela de execução com um entregável: direção, problema, oferta, MVP, posicionamento, distribuição.",
  },
  {
    code: "03",
    name: "Ship",
    title: "Coloque no mercado.",
    text: "No DAY 07 a oferta vai ao ar. O Build Score mostra onde você está — e qual é o próximo movimento.",
  },
];

export function Landing(props: { onStart: () => void; onSaved?: () => void }) {
  return (
    <div className="landing">
      <header className="topbar wrap">
        <span className="wordmark topbar__mark">ALPHA</span>
        <Link className="btn btn--quiet" href="/entrar">
          Já comprou? Entrar
        </Link>
      </header>

      <section className="hero wrap">
        <div className="hero__copy">
          <span className="micro enter">7-DAY BUILD</span>
          <h1 className="display hero__title">
            <span className="mask" style={{ "--i": 0 } as CSSProperties}>
              <span>Stop consuming.</span>
            </span>
            <span className="mask" style={{ "--i": 1 } as CSSProperties}>
              <span>Start building.</span>
            </span>
          </h1>
          <p className="lead hero__lead enter" style={{ "--i": 4 } as CSSProperties}>
            Um sistema de execução de 7 dias para transformar uma direção em uma oferta digital pronta para o mercado.{" "}
            <span className="hero__next">Descubra por onde começar.</span>
          </p>
          <div className="hero__actions enter" style={{ "--i": 5 } as CSSProperties}>
            <button className="btn btn--primary btn--lg" onClick={props.onStart}>
              Montar minha rota <Arrow />
            </button>
            <span className="caption">3 perguntas · menos de 1 minuto</span>
          </div>
          {props.onSaved && (
            <button className="btn btn--quiet hero__saved enter" style={{ "--i": 6 } as CSSProperties} onClick={props.onSaved}>
              Ver minha rota salva →
            </button>
          )}
        </div>
        <div className="hero__demo enter" style={{ "--i": 3 } as CSSProperties}>
          <BuildDemo />
        </div>
      </section>

      <section className="acts wrap" aria-label="Como funciona">
        <Reveal className="acts__head">
          <h2 className="h2">Discover → Build → Ship.</h2>
          <p className="body">Não é um curso. É uma sequência de construção com começo, meio e entrega.</p>
        </Reveal>
        <ol className="acts__list">
          {ACTS.map((a, i) => (
            <Reveal as="li" key={a.code} i={i} className="acts__item">
              <span className="acts__code num">{a.code}</span>
              <span className="label">{a.name}</span>
              <h3 className="h3">{a.title}</h3>
              <p className="body">{a.text}</p>
            </Reveal>
          ))}
        </ol>
        <Reveal className="acts__cta">
          <button className="btn btn--primary btn--lg" onClick={props.onStart}>
            Montar minha rota <Arrow />
          </button>
        </Reveal>
      </section>

      <footer className="foot wrap">
        <span className="micro">BUILD THE LIFE YOU WANT</span>
      </footer>
    </div>
  );
}
