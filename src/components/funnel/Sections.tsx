"use client";

// Blocos editoriais compartilhados pela landing e pela página de resultado.
// Mesma gramática da área de membros (números finos, linhas, eixo), com mais escala.

import type { ReactNode } from "react";
import { OFFER } from "@/config";
import { BUILD_DAYS } from "@/lib/quiz";
import { Reveal } from "../ui";

const pad = (n: number) => String(n).padStart(2, "0");

/** Cabeçalho de seção: número fino + rótulo + título. */
export function SecHead(props: { n?: number; label: string; title: ReactNode; children?: ReactNode }) {
  return (
    <Reveal className="sechead">
      <span className="sechead__top">
        {props.n !== undefined && <span className="sechead__num num">{pad(props.n)}</span>}
        <span className="label">{props.label}</span>
      </span>
      <h2 className="sechead__title">{props.title}</h2>
      {props.children && <div className="sechead__body">{props.children}</div>}
    </Reveal>
  );
}

/** O método: os 7 dias em eixo vertical — dia, nome, o que se faz, o que sai. */
export function MethodAxis(props: { tasks?: boolean }) {
  return (
    <ol className="axis">
      {BUILD_DAYS.map((d, i) => (
        <Reveal as="li" key={d.code} i={i % 3} className="axis__item">
          <span className="axis__num num">{pad(i + 1)}</span>
          <div className="axis__main">
            <span className="axis__name">{d.name}</span>
            {props.tasks && <p className="axis__task">{d.task}</p>}
            <p className="axis__out">{props.tasks ? `Entregável — ${d.output}` : `→ ${d.output}`}</p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}

/** O ciclo de consumo × o caminho de construção. */
export function Chains(props: { loop?: [string, string]; path?: [string, string] }) {
  const [loopLabel, loop] = props.loop ?? ["Hoje", "curso → conteúdo → ajuste → ferramenta → mais conteúdo"];
  const [pathLabel, path] = props.path ?? ["No 7-Day Build", "direção → problema → oferta → MVP → mercado"];
  return (
    <div className="chains">
      <p className="chains__row is-loop">
        <span className="label">{loopLabel}</span>
        <span>{loop}</span>
      </p>
      <p className="chains__row">
        <span className="label">{pathLabel}</span>
        <span>{path}</span>
      </p>
    </div>
  );
}

export const BUILT = ["DIRECTION", "PROBLEM", "OFFER", "MVP", "POSITION", "DISTRIBUTION", "FIRST 10", "LAUNCH"];

/** O que existe no final dos 7 dias: as 8 partes e o documento que as reúne. */
export function BuiltList() {
  return (
    <ol className="built">
      {BUILT.map((b, i) => (
        <Reveal as="li" key={b} i={i % 3} className="built__item">
          <span className="num">{pad(i + 1)}</span>
          <span>{b}</span>
        </Reveal>
      ))}
      <Reveal as="li" className="built__item is-final">
        <span className="num">=</span>
        <span>First Market Test</span>
      </Reveal>
    </ol>
  );
}

const FOR = [
  "Quem quer construir algo real.",
  "Quem tem uma direção, mas não sabe transformar em oferta.",
  "Quem quer testar antes de passar meses construindo.",
];
const NOT_FOR = [
  "Quem procura renda garantida.",
  "Quem quer fórmula de enriquecimento.",
  "Quem quer apenas consumir aulas.",
  "Quem espera que a ALPHA faça a execução por ele.",
];

export function ForWho() {
  return (
    <div className="forwho">
      <Reveal className="forwho__col">
        <span className="label">Para quem é</span>
        <ul>
          {FOR.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Reveal>
      <Reveal i={1} className="forwho__col is-not">
        <span className="label">Não é para</span>
        <ul>
          {NOT_FOR.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}

const INCLUDED = [
  "7 dias de execução",
  "Método e lições",
  "Exemplos por rota",
  "Exercícios com salvamento automático",
  "Roteiro de descoberta",
  "Scripts de abordagem",
  "Respostas a objeções",
  "First 10",
  "Build Stack",
  "Build Score",
  "First Market Test",
];

/** O que vem no 7-Day Build + tempo + preço + CTA. */
export function Offer(props: { cta: ReactNode; note?: ReactNode; route?: string }) {
  return (
    <div className="offer">
      <Reveal className="offer__what">
        <span className="label">O que você recebe</span>
        <p className="offer__name">
          ALPHA Launch — 7-Day Build{props.route ? <span className="offer__route">Rota {props.route}</span> : null}
        </p>
        <ul className="offer__list">
          {INCLUDED.map((t, i) => (
            <li key={t}>
              <span className="num">{pad(i + 1)}</span>
              {t}
            </li>
          ))}
        </ul>
        <p className="offer__time">Reserve cerca de 30–60 minutos por dia.</p>
      </Reveal>
      <Reveal i={1} className="offer__buy">
        <p className="offer__price num">{OFFER.priceLabel}</p>
        <p className="offer__terms">Pagamento único · Acesso imediato</p>
        {props.cta}
        {props.note}
      </Reveal>
    </div>
  );
}

const FAQ: { q: string; a: string }[] = [
  {
    q: "Preciso saber programar?",
    a: "Não. O DAY 04 serve para definir o menor MVP capaz de entregar o resultado. Programar não é requisito.",
  },
  { q: "Quanto tempo leva?", a: "Reserve cerca de 30–60 minutos por dia. O progresso é salvo." },
  {
    q: "E se eu não tiver uma ideia?",
    a: "O quiz indica uma rota. No DAY 01 você transforma isso em uma direção concreta.",
  },
  { q: "É um curso?", a: "Não. É um sprint de execução. Cada dia termina com um entregável." },
  {
    q: "O que acontece depois dos 7 dias?",
    a: "Você termina com seu Build Score e seu First Market Test, além de um próximo movimento claro.",
  },
  {
    q: "Como recebo acesso?",
    a: "Após a confirmação da compra, você recebe as instruções para acessar o ALPHA Launch.",
  },
];

export function Faq() {
  return (
    <ul className="faq">
      {FAQ.map((f) => (
        <li key={f.q}>
          <details className="faq__item">
            <summary>
              <span>{f.q}</span>
              <span className="faq__sign" aria-hidden />
            </summary>
            <p>{f.a}</p>
          </details>
        </li>
      ))}
    </ul>
  );
}
