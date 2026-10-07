"use client";

// /v2 — Fase 4: a camada comercial depois do BUILD COMPLETE.
// A experiência não para para vender: o sistema que acabou de se montar ganha nome, mecanismo,
// especificação, valor, risco, preço e porta final. Só fatos que o produto já entrega.
// O BUILD CORE não é tocado; aqui ele só reaparece como pôster (imagem já existente) ao lado do preço.

import type { ReactNode } from "react";
import { OFFER } from "@/config";
import { Faq } from "../funnel/Sections";
import { Reveal } from "../ui";

const ROUTES = ["AI Service Builder", "Expertise Builder", "Backstage Builder", "Distribution Builder"];

const STEPS: { n: string; title: string; body: ReactNode }[] = [
  {
    n: "01",
    title: "3 perguntas → sua rota.",
    body: (
      <>
        Ponto de partida, exposição e ritmo. A resposta indica uma das quatro rotas:
        <span className="v2-routes">
          {ROUTES.map((r) => (
            <span key={r}>{r}</span>
          ))}
        </span>
      </>
    ),
  },
  {
    n: "02",
    title: "7 dias. 1 entregável por dia.",
    body: "Cerca de 30–60 minutos por dia. Cada dia termina com uma parte construída, e o progresso fica salvo.",
  },
  {
    n: "03",
    title: "DAY 07 → mercado.",
    body: "Sua oferta vai para o mercado. Você fecha com o Build Score e o First Market Test.",
  },
];

const SPEC: { group: string; items: [string, string][] }[] = [
  {
    group: "Sistema",
    items: [
      ["7 dias de execução", "Um build por dia, em ordem"],
      ["Método e lições", "Texto curto, direto ao que se faz no dia"],
      ["Exemplos por rota", "Na medida da rota que o quiz indicar"],
      ["Exercícios", "Salvamento automático"],
    ],
  },
  {
    group: "Ferramentas de mercado",
    items: [
      ["Roteiro de descoberta", "Para conversar antes de construir demais"],
      ["Scripts de abordagem", "Para iniciar as conversas"],
      ["Respostas a objeções", "Para o que aparece nelas"],
      ["First 10", "As primeiras 10 conversas reais"],
    ],
  },
  {
    group: "Instrumentos",
    items: [
      ["Build Stack", "Os 7 dias construídos, empilhados"],
      ["Build Score", "7 critérios no DAY 07"],
    ],
  },
  {
    group: "Saída",
    items: [["First Market Test", "As 8 partes juntas, prontas para o mercado"]],
  },
];

const BUILT = ["DIRECTION", "PROBLEM", "OFFER", "MVP", "POSITION", "DISTRIBUTION", "FIRST 10", "LAUNCH"];

const FOR = [
  "Quem quer construir algo real.",
  "Quem tem uma direção, mas não sabe transformar em oferta.",
  "Quem quer testar antes de passar meses construindo.",
];
const NOT_FOR = [
  "Quem procura renda garantida.",
  "Quem quer fórmula de enriquecimento.",
  "Quem quer apenas consumir.",
  "Quem espera que a ALPHA execute por ele.",
];

const FRICTION: [string, string][] = [
  ["Não precisa programar.", "O DAY 04 define o menor MVP. Definir, não programar."],
  ["Não precisa ter uma ideia.", "O quiz indica a rota; o DAY 01 vira direção."],
  ["Cabe na rotina.", "Cerca de 30–60 minutos por dia, com progresso salvo."],
  ["Acesso por e-mail.", "Confirmada a compra, o link de acesso chega no seu e-mail."],
];

export function OfferV2(props: { cta: ReactNode }) {
  const action = (
    <div className="v2-cta">
      {props.cta}
      <span className="caption">Primeiro, 3 perguntas para montar sua rota.</span>
    </div>
  );

  return (
    <div className="v2-offer">
      {/* ---------- 04 THE SYSTEM: transição + manifestação ---------- */}
      <section className="v2-sys wrap">
        <Reveal>
          <span className="label v2-ch">04 — The system</span>
          <h2 className="v2-sys__name">Isto é o ALPHA LAUNCH.</h2>
        </Reveal>
        <Reveal i={1} className="v2-sys__body">
          <p className="v2-sys__lead">Um sistema de 7 dias que transforma uma direção em uma oferta pronta para ir ao mercado.</p>
          <p className="v2-sys__manifest">Build, don&apos;t consume.</p>
        </Reveal>
      </section>

      {/* ---------- 05 HOW IT WORKS: o mecanismo cabe em três linhas ---------- */}
      <section className="v2-sec wrap">
        <Reveal className="v2-sec__head">
          <span className="label v2-ch">05 — How it works</span>
          <h2 className="v2-h3">Três movimentos. Nenhum é assistir.</h2>
        </Reveal>
        <ol className="v2-steps">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} i={i} className="v2-step">
              <span className="v2-step__n num">{s.n}</span>
              <div>
                <p className="v2-step__t">{s.title}</p>
                <p className="v2-step__b">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ---------- 06 WHAT YOU RECEIVE: ficha técnica, não lista de módulos ---------- */}
      <section className="v2-sec wrap">
        <Reveal className="v2-sec__head">
          <span className="label v2-ch">06 — Specification</span>
          <h2 className="v2-h3">O que vem no sistema.</h2>
        </Reveal>
        <div className="v2-spec">
          {SPEC.map((g, gi) => (
            <Reveal key={g.group} i={gi % 3} className="v2-spec__group">
              <span className="label">{g.group}</span>
              <dl>
                {g.items.map(([k, v]) => (
                  <div key={k} className="v2-spec__row">
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          ))}
        </div>
        <Reveal className="v2-day8">
          <p className="v2-day8__t">Ao final dos 7 dias, você tem:</p>
          <ol className="v2-day8__list">
            {BUILT.map((b, i) => (
              <li key={b}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                {b}
              </li>
            ))}
            <li className="is-sum">
              <span className="num">=</span>First Market Test
            </li>
          </ol>
        </Reveal>
      </section>

      {/* ---------- 07 OUTPUT: o valor está na densidade do que sai, não no custo diário ---------- */}
      <section className="v2-sec wrap">
        <Reveal className="v2-value">
          <span className="label v2-ch">07 — Output</span>
          <p className="v2-value__math">7 dias. 8 partes construídas.</p>
          <ol className="v2-day8__list v2-value__parts">
            {BUILT.map((b, i) => (
              <li key={b}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                {b}
              </li>
            ))}
            <li className="is-sum">
              <span className="num">=</span>First Market Test
            </li>
          </ol>
          <div className="v2-value__vs">
            <p>
              <span className="label">Mais conteúdo</span>
              Meses consumindo, nenhum entregável.
            </p>
            <p>
              <span className="label">7-Day Build</span>
              Uma semana, uma oferta pronta para testar no mercado.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ---------- 08 RISK / FRICTION: autosseleção + atrito removido antes do preço ---------- */}
      <section className="v2-sec wrap">
        <Reveal className="v2-sec__head">
          <span className="label v2-ch">08 — Before you start</span>
          <h2 className="v2-h3">Feito para quem vai executar.</h2>
        </Reveal>
        <div className="v2-fit">
          <Reveal className="v2-fit__col">
            <span className="label">Para quem é</span>
            <ul>
              {FOR.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal i={1} className="v2-fit__col is-not">
            <span className="label">Não é para</span>
            <ul>
              {NOT_FOR.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Reveal>
        </div>
        <dl className="v2-friction">
          {FRICTION.map(([k, v], i) => (
            <Reveal key={k} i={i % 3} className="v2-friction__row">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* ---------- 09 PRICE + CTA: um único lugar, sem ruído ---------- */}
      <section className="v2-sec v2-price wrap" id="comecar">
        <Reveal className="v2-price__obj">
          <img src="/v2/core-2.webp" alt="" loading="lazy" decoding="async" />
        </Reveal>
        <Reveal i={1} className="v2-price__buy">
          <span className="label v2-ch">09 — Start</span>
          <p className="v2-price__name">ALPHA LAUNCH — 7-Day Build</p>
          <p className="v2-price__val num">{OFFER.priceLabel}</p>
          <p className="v2-price__terms">Pagamento único · Acesso imediato</p>
          {action}
        </Reveal>
      </section>

      {/* ---------- 10 FAQ: só perguntas com resposta confirmada ---------- */}
      <section className="v2-sec wrap">
        <Reveal className="v2-sec__head">
          <span className="label v2-ch">10 — Questions</span>
          <h2 className="v2-h3">Antes de começar.</h2>
        </Reveal>
        <Faq />
      </section>

      {/* ---------- 11 FINAL DOOR: só texto, escolha de identidade ---------- */}
      <section className="v2-door wrap">
        <Reveal>
          <p className="v2-door__lead">
            Quase todo mundo escolhe consumir mais uma coisa.
            <br />
            <span>Você pode construir a sua.</span>
          </p>
        </Reveal>
        <Reveal i={1}>{action}</Reveal>
      </section>

      <footer className="v2-sign wrap">
        <span className="micro">ALPHA — BUILD THE LIFE YOU WANT</span>
      </footer>
    </div>
  );
}
