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
            <p className="axis__out">→ {d.output}</p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}

export const BUILT = [
  "Direção",
  "Problema",
  "Oferta",
  "MVP",
  "Posicionamento",
  "Distribuição",
  "First 10",
  "Plano de lançamento",
  "First Market Test",
];

/** O que existe no final dos 7 dias. */
export function BuiltList() {
  return (
    <ol className="built">
      {BUILT.map((b, i) => (
        <Reveal as="li" key={b} i={i % 3} className={`built__item${i === BUILT.length - 1 ? " is-final" : ""}`}>
          <span className="num">{pad(i + 1)}</span>
          <span>{b}</span>
        </Reveal>
      ))}
    </ol>
  );
}

const FOR = [
  "Quem quer construir algo próprio.",
  "Quem tem ideias, mas não consegue transformar em execução.",
  "Quem quer testar uma oferta antes de passar meses construindo.",
  "Quem quer aprender a encontrar e abordar os primeiros potenciais clientes.",
];
const NOT_FOR = [
  "Quem quer apenas consumir mais conteúdo.",
  "Quem procura fórmula de dinheiro rápido.",
  "Quem não pretende executar.",
  "Quem quer construir um produto complexo antes de validar.",
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
  "Método e lições curtas, em leitura contínua",
  "Exemplos por rota",
  "Exercícios com salvamento automático",
  "Roteiro de descoberta",
  "Roteiros de abordagem e respostas a objeções",
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
    a: "Não. No 7-Day Build, MVP é a menor versão capaz de entregar o resultado — você define e prepara a primeira entrega com o que já existe: documento, planilha, ferramenta pronta, serviço simples. Nada de código.",
  },
  {
    q: "Quanto tempo preciso por dia?",
    a: "Reserve cerca de 30–60 minutos por dia. É uma referência, não uma regra: o progresso fica salvo e você navega livremente entre os dias.",
  },
  {
    q: "E se eu ainda não tiver uma ideia?",
    a: "O quiz indica a rota que combina com o que você tem hoje. O DAY 01 parte daí: três candidatas, cinco filtros e uma direção para testar — com exemplos para cada rota.",
  },
  {
    q: "É um curso?",
    a: "Não. É um sprint de execução. Cada dia tem uma lição curta, exemplos, um exercício e um entregável. Você termina com um plano construído por você, não com horas de aula assistidas.",
  },
  {
    q: "O que acontece depois dos 7 dias?",
    a: "Você faz o Build Score e recebe o seu First Market Test: o documento com tudo o que construiu, da direção à primeira mensagem — e o próximo movimento definido.",
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
