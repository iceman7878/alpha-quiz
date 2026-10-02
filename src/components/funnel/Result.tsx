"use client";

// Resultado = página de venda completa, contextual à rota (sem quatro páginas diferentes):
// rota → contexto → problema → ALPHA Launch → 7 dias → First 10 → First Market Test (exemplo)
// → porta vazia → para quem → o que recebe → FAQ → preço.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { OFFER } from "@/config";
import { personalLine, type Route } from "@/lib/quiz";
import { track } from "@/lib/tracking";
import { Arrow, Reveal, RouteMap, TwoDoors } from "../ui";
import { Faq, ForWho, MethodAxis, Offer, SecHead } from "./Sections";
import type { Lead } from "./Steps";

const FIRST10 = ["Encontrar 30", "Selecionar 10", "Abordar", "Conversar", "Apresentar", "Follow-up"];

export function Result(props: { route: Route; answers: number[]; lead: Lead | null; checkoutHref: string; onRestart: () => void }) {
  const { route, lead } = props;
  const heroCta = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(true);

  // Barra de compra fixa: visível sempre que nenhum CTA principal está na tela.
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

  const cta = (
    <a className="btn btn--primary btn--lg" href={props.checkoutHref} onClick={onCheckout}>
      Comece seu 7-Day Build <Arrow />
    </a>
  );

  return (
    <div className="result">
      {/* ---------- ROTA IDENTIFICADA ---------- */}
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
          <div className="route__cta enter" style={{ "--i": 6 } as CSSProperties} ref={heroCta}>
            {cta}
            <p className="route__price">
              <span className="num">{OFFER.priceLabel}</span>
              <span>Pagamento único · Acesso imediato</span>
            </p>
          </div>
        </div>
        <div className="route__map enter" style={{ "--i": 3 } as CSSProperties}>
          <RouteMap picked={route.key} />
        </div>
      </section>

      {/* ---------- CONTEXTO ---------- */}
      <section className="block wrap">
        <SecHead n={1} label="Seu ponto de partida" title="Montado a partir das suas respostas.">
          <p>{route.statement}</p>
        </SecHead>
        <div className="ctx">
          <Reveal className="ctx__pair">
            <span className="label">Na sua rota, uma ideia vira direção assim</span>
            <p className="ctx__before">{route.example.before}</p>
            <p className="ctx__after">{route.example.after}</p>
          </Reveal>
          <Reveal i={1} className="ctx__day">
            <span className="label">Seu DAY 01 começa com</span>
            <p>{route.day01}</p>
          </Reveal>
        </div>
      </section>

      {/* ---------- O PROBLEMA ---------- */}
      <section className="pitch wrap">
        <Reveal>
          <h2 className="pitch__problem">
            Você não precisa de mais conteúdo.
            <br />
            <span>Precisa colocar algo no mercado.</span>
          </h2>
        </Reveal>
        <Reveal i={1} className="pitch__body">
          <p>
            O ciclo comum: consumir, planejar, construir por meses — e só então descobrir se alguém quer. O ALPHA Launch
            inverte a ordem.
          </p>
          <p className="pitch__alt">7 dias. 1 construção. Execução real.</p>
        </Reveal>
      </section>

      {/* ---------- O ALPHA LAUNCH ---------- */}
      <section className="block wrap">
        <SecHead n={2} label="O ALPHA Launch" title="Um sprint de execução, não um curso.">
          <p>
            Cada dia tem uma lição curta, exemplos da sua rota, um exercício e um entregável. O que você escreve fica salvo
            e vira a base do dia seguinte.
          </p>
        </SecHead>
        <Reveal i={1}>
          <DayPreview />
        </Reveal>
      </section>

      {/* ---------- OS 7 DIAS ---------- */}
      <section className="block wrap">
        <SecHead n={3} label="Os 7 dias" title="Da direção ao mercado." />
        <MethodAxis tasks />
      </section>

      {/* ---------- FIRST 10 ---------- */}
      <section className="block wrap">
        <SecHead n={4} label="First 10" title="Dez conversas reais antes de qualquer escala.">
          <p>No DAY 06 e no DAY 07 você monta a lista, aborda e conversa — com roteiros prontos para adaptar.</p>
        </SecHead>
        <ol className="seq10">
          {FIRST10.map((s, i) => (
            <Reveal as="li" key={s} i={i % 3}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              <span>{s}</span>
            </Reveal>
          ))}
        </ol>
        <Reveal className="ctx__day">
          <span className="label">Onde estão as primeiras 30 pessoas na sua rota</span>
          <p>{route.first30}</p>
        </Reveal>
      </section>

      {/* ---------- FIRST MARKET TEST (demonstração) ---------- */}
      <section className="block wrap">
        <SecHead n={5} label="First Market Test" title="O documento com que você sai.">
          <p>Tudo o que você construiu, da direção à primeira mensagem, em um só lugar — e o próximo movimento definido.</p>
        </SecHead>
        <Reveal i={1}>
          <FmtPreview direction={route.example.after} />
        </Reveal>
      </section>

      {/* ---------- A PORTA VAZIA ---------- */}
      <section className="block doorsec wrap">
        <SecHead n={6} label="A porta vazia" title="Quase todo mundo escolhe a porta errada.">
          <p>
            Mais um ajuste, mais uma funcionalidade, mais um curso. Construir parece progresso — e é confortável, porque
            ninguém pode dizer não. A porta de conseguir clientes vive vazia.
          </p>
        </SecHead>
        <Reveal i={1} className="doorsec__fig">
          <TwoDoors />
        </Reveal>
        <Reveal i={2}>
          <p className="door-text__body">O 7-Day Build termina nela: no DAY 07, sua oferta vai para o mercado.</p>
        </Reveal>
      </section>

      {/* ---------- PARA QUEM ---------- */}
      <section className="block wrap">
        <SecHead n={7} label="Para quem" title="Feito para quem vai executar." />
        <ForWho />
      </section>

      {/* ---------- O QUE RECEBE + PREÇO ---------- */}
      <section className="block wrap">
        <div ref={priceRef}>
          <Offer
            route={route.name}
            cta={cta}
            note={
              <p className="caption offer__note">
                O ALPHA Launch organiza a construção. O resultado depende da sua execução — não há promessa de ganho.
              </p>
            }
          />
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="block wrap">
        <SecHead n={8} label="Perguntas" title="Antes de começar." />
        <Faq />
        <Reveal className="final-cta">
          <p className="final-cta__line">Sua rota está pronta. O DAY 01 também.</p>
          {cta}
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

/** Recorte da tela de um dia, como ela é no app (texto real do método do DAY 02). */
function DayPreview() {
  return (
    <figure className="frame" aria-label="Prévia da tela de um dia no app">
      <div className="frame__bar">
        <span>DAY 02 — PROBLEM</span>
        <span className="frame__tag">Prévia do app</span>
      </div>
      <div className="frame__body">
        <div className="frame__ch">
          <span className="frame__num num">03</span>
          <div>
            <span className="label">The method</span>
            <ol className="frame__steps">
              {["Observar", "Perguntar", "Ouvir", "Identificar o padrão", "Formular"].map((s, i) => (
                <li key={s}>
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="frame__note">
          <span className="label">Field note</span>
          <p>Evidência vale mais que opinião — inclusive a sua.</p>
        </div>
      </div>
    </figure>
  );
}

/** Demonstração do formato do First Market Test. Só a direção vem do exemplo da rota; o resto é o espaço que a pessoa preenche. */
function FmtPreview({ direction }: { direction: string }) {
  const rows: [string, string, string][] = [
    ["01", "DIRECTION", direction],
    ["02", "PROBLEM", "[o problema, nas palavras de quem sente]"],
    ["03", "OFFER", "[para quem · resultado · mecanismo · preço]"],
    ["04", "MVP", "[a menor versão que entrega o resultado]"],
    ["05", "POSITION", "[headline · promessa · CTA]"],
    ["06", "DISTRIBUTION", "[caminho · canal · onde estão as primeiras 30]"],
    ["07", "FIRST 10", "[as 10 pessoas que você vai abordar]"],
    ["08", "LAUNCH", "[onde a oferta está · métrica · data de revisão]"],
  ];
  return (
    <figure className="fmtp" aria-label="Exemplo do formato do First Market Test">
      <div className="fmtp__bar">
        <span className="label">First Market Test</span>
        <span className="frame__tag">Preview / Example</span>
      </div>
      <ol className="fmtp__list">
        {rows.map(([n, stage, v], i) => (
          <li key={n}>
            <span className="fmtp__num num">{n}</span>
            <span className="fmtp__stage">{stage}</span>
            <span className={i === 0 ? "fmtp__val" : "fmtp__val is-slot"}>{v}</span>
          </li>
        ))}
      </ol>
      <div className="fmtp__next">
        <span className="label">Next move</span>
        <p>Mande a mensagem para [pessoa nº 1]. Depois, as outras 9 até [data de revisão].</p>
      </div>
      <figcaption className="fmtp__cap">
        Demonstração do formato. A direção é um exemplo da sua rota; o restante é escrito por você durante os 7 dias.
      </figcaption>
    </figure>
  );
}
