"use client";

// Resultado = diagnóstico + página de vendas personalizada.
// YOUR ROUTE → YOUR NEXT MOVE → o sistema → Build Score → oferta.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { OFFER } from "@/config";
import { BUILD_DAYS, personalLine, type Route } from "@/lib/quiz";
import { track } from "@/lib/tracking";
import { Arrow, Artifact, Rail, Reveal, RouteMap, TwoDoors } from "../ui";
import type { Lead } from "./Steps";

const BUILD_LEVELS = [
  { code: "01", title: "Você começou.", fill: 1 / 3 },
  { code: "02", title: "Você construiu.", fill: 2 / 3 },
  { code: "03", title: "Você colocou no mercado.", fill: 1 },
];

const OUTPUTS_BY_DAY = [
  "Minha direção",
  "O problema que vou resolver",
  "Minha oferta",
  "MVP definido",
  "Meu posicionamento",
  "Meu plano de distribuição",
  "Oferta no mercado",
];

export function Result(props: { route: Route; answers: number[]; lead: Lead | null; checkoutHref: string; onRestart: () => void }) {
  const { route, lead } = props;
  const heroCta = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(true);

  // Barra de compra fixa: visível sempre que nenhum CTA da página está na tela.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const seen = { hero: false, price: false };
    const update = () => setShowBar(!seen.hero && !seen.price);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === heroCta.current) seen.hero = e.isIntersecting;
        if (e.target === priceRef.current) seen.price = e.isIntersecting;
      }
      update();
    });
    if (heroCta.current) io.observe(heroCta.current);
    if (priceRef.current) io.observe(priceRef.current);
    return () => io.disconnect();
  }, []);

  const onCheckout = () =>
    track("InitiateCheckout", { content_name: OFFER.name, value: OFFER.price, currency: "BRL", rota: route.key });

  const words = route.name.split(" ");
  const last = words.pop() ?? "";
  const head = words.join(" ");

  return (
    <div className="result">
      {/* ---------- YOUR ROUTE ---------- */}
      <section className="route wrap">
        <div className="route__copy">
          <span className="micro enter">SUA ROTA — {route.code}</span>
          <p className="route__eyebrow enter" style={{ "--i": 1 } as CSSProperties}>
            {lead ? `${lead.nome}, sua rota é` : "Sua rota é"}
          </p>
          <h1 className="display route__name">
            <span className="mask" style={{ "--i": 1 } as CSSProperties}>
              <span>{head}</span>
            </span>
            <span className="mask" style={{ "--i": 2 } as CSSProperties}>
              <span>{last}</span>
            </span>
          </h1>
          <p className="label route__model enter" style={{ "--i": 4 } as CSSProperties}>
            {route.model}
          </p>
          <p className="lead route__personal enter" style={{ "--i": 5 } as CSSProperties}>
            {personalLine(props.answers)}
          </p>
          <p className="body enter" style={{ "--i": 6 } as CSSProperties}>
            {route.statement}
          </p>
        </div>
        <div className="route__map enter" style={{ "--i": 3 } as CSSProperties}>
          <RouteMap picked={route.key} />
        </div>
      </section>

      {/* ---------- YOUR NEXT MOVE ---------- */}
      <section className="move wrap">
        <Reveal className="move__head">
          <span className="label">Seu próximo movimento</span>
        </Reveal>
        <ol className="move__steps">
          {route.objective.map((o, i) => (
            <Reveal as="li" key={o} i={i} className="move__step">
              <span className="move__num num">{i + 1}</span>
              <span className="h3">{o.charAt(0).toUpperCase() + o.slice(1)}</span>
            </Reveal>
          ))}
        </ol>
        <div className="move__grid">
          <Reveal className="move__day">
            <Artifact title="Seu DAY 01" state="Pronto para começar">
              <p className="artifact__body">{route.day01}</p>
            </Artifact>
          </Reveal>
          <Reveal i={1} className="move__cta">
            <div ref={heroCta}>
              <p className="body">
                7-Day Build: 7 dias para transformar essa direção em uma oferta real — um entregável por dia, dentro do
                app da ALPHA.
              </p>
              <a className="btn btn--primary btn--lg btn--block" href={props.checkoutHref} onClick={onCheckout}>
                Comece seu 7-Day Build <span className="btn__meta">{OFFER.priceLabel}</span> <Arrow />
              </a>
              <p className="caption">Pagamento único · acesso imediato por e-mail</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- MANIFESTO ---------- */}
      <section className="manifesto wrap">
        <Reveal>
          <h2 className="display manifesto__title">
            Stop consuming.
            <br />
            Start building.
          </h2>
        </Reveal>
        <div className="manifesto__cols">
          <Reveal i={1}>
            <p className="h3">Construa seu primeiro ativo digital em 7 dias.</p>
          </Reveal>
          <Reveal i={2} className="manifesto__body">
            <p className="body">
              Você não precisa de mais um curso. Não precisa passar meses estudando. E não precisa esperar estar pronto.
            </p>
            <p className="body">
              O ALPHA LAUNCH é um sprint de 7 dias criado para transformar uma direção em um ativo digital real, com uma
              oferta pronta para colocar no mercado.
            </p>
            <p className="manifesto__line">7 dias. 1 construção. Execução real.</p>
          </Reveal>
        </div>
      </section>

      {/* ---------- O SISTEMA: 7 DIAS ---------- */}
      <section className="system wrap">
        <Reveal className="section-head">
          <span className="label">O sistema</span>
          <h2 className="h2">Sua rota começa aqui.</h2>
          <p className="body">
            Com base nas suas respostas, você já descobriu qual direção faz mais sentido. Agora é hora de transformar essa
            direção em algo concreto.
          </p>
        </Reveal>
        <Reveal className="system__rail">
          <Rail
            ariaLabel="Os 7 dias"
            progress={0}
            nodes={BUILD_DAYS.map((d, i) => ({ label: d.code, done: false, current: i === 0 }))}
          />
        </Reveal>
        <ol className="system__days">
          {BUILD_DAYS.map((d, i) => (
            <Reveal as="li" key={d.code} i={i} className="system__day">
              <span className="system__code num">{d.code}</span>
              <span className="system__name">{d.name}</span>
              <p className="system__task">{d.task}</p>
              <p className="system__out">→ {OUTPUTS_BY_DAY[i]}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ---------- DUAS PORTAS ---------- */}
      <section className="doorsec wrap">
        <Reveal className="section-head">
          <span className="label">A porta vazia</span>
          <h2 className="h2">Quase todo mundo escolhe a porta errada.</h2>
          <p className="body">
            Mais um ajuste, mais uma funcionalidade, mais um curso. Construir parece progresso — e é confortável, porque
            ninguém pode dizer não. A porta de conseguir clientes vive vazia.
          </p>
        </Reveal>
        <Reveal i={1} className="doorsec__fig">
          <TwoDoors />
        </Reveal>
        <Reveal i={2}>
          <p className="manifesto__line">O 7-Day Build termina nela: no DAY 07, sua oferta vai para o mercado.</p>
        </Reveal>
      </section>

      {/* ---------- BUILD SCORE ---------- */}
      <section className="scale wrap">
        <Reveal className="section-head">
          <span className="label">Build Score</span>
          <h2 className="h2">No final, você vai saber onde está.</h2>
          <p className="body">No último dia, você avalia sua construção em 7 critérios objetivos. O resultado define seu nível.</p>
        </Reveal>
        <ol className="scale__levels">
          {BUILD_LEVELS.map((l, i) => (
            <Reveal as="li" key={l.code} i={i} className="scale__level">
              <span className="scale__code">
                BUILD <span className="num">{l.code}</span>
              </span>
              <span className="scale__meter" style={{ "--fill": l.fill } as CSSProperties} aria-hidden />
              <span className="scale__title">{l.title}</span>
            </Reveal>
          ))}
        </ol>
        <Reveal>
          <p className="manifesto__line">Porque estudar não é o objetivo. Construir é.</p>
        </Reveal>
      </section>

      {/* ---------- OFERTA ---------- */}
      <section className="pricing wrap">
        <Reveal>
          <div ref={priceRef}>
            <Artifact title={OFFER.name} sealed className="pricing__card">
              <div className="pricing__grid">
                <div>
                  <p className="pricing__route">7-Day Build · rota {route.name}</p>
                  <p className="pricing__value num">{OFFER.priceLabel}</p>
                  <p className="caption">Pagamento único · acesso imediato por e-mail</p>
                </div>
                <ul className="pricing__list">
                  <li>A sua rota, montada a partir das suas respostas</li>
                  <li>7 telas de execução, uma por dia, com progresso salvo</li>
                  <li>Templates prontos para copiar: oferta, página, scripts de venda, hooks, prompts</li>
                  <li>Build Score no DAY 07</li>
                </ul>
              </div>
              <a className="btn btn--primary btn--lg btn--block" href={props.checkoutHref} onClick={onCheckout}>
                Comece seu 7-Day Build <Arrow />
              </a>
              <p className="caption pricing__note">
                O ALPHA LAUNCH organiza a construção. O resultado depende da sua execução — não há promessa de ganho.
              </p>
            </Artifact>
          </div>
        </Reveal>
      </section>

      <footer className="foot foot--result wrap">
        <button className="btn btn--quiet" onClick={props.onRestart}>
          Refazer o quiz
        </button>
        <p className="signature">
          <span className="wordmark signature__mark">ALPHA</span>
          <span className="micro">BUILD THE LIFE YOU WANT</span>
        </p>
      </footer>

      <div className={`buybar${showBar ? " is-on" : ""}`} aria-hidden={!showBar}>
        <div className="buybar__inner wrap">
          <span className="buybar__txt">
            <span className="buybar__name">{OFFER.name}</span> <span className="num">{OFFER.priceLabel}</span>
          </span>
          <a className="btn btn--primary" href={props.checkoutHref} onClick={onCheckout} tabIndex={showBar ? 0 : -1}>
            Começar <Arrow />
          </a>
        </div>
      </div>
    </div>
  );
}
