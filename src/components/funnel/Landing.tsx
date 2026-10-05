"use client";

// Entrada do funil: curta. Hero decide; abaixo, problema → alternativa → método → o que você constrói
// → porta vazia (só em texto: o desenho é exclusivo do resultado e do DAY 07) → para quem → oferta → FAQ.
// Todo CTA daqui leva ao quiz; o checkout só aparece no resultado.

import Link from "next/link";
import { useEffect, useRef, type CSSProperties } from "react";
import { OFFER } from "@/config";
import { Arrow, Reveal } from "../ui";
import { BuildDemo } from "./BuildDemo";
import { BuiltList, Chains, Faq, ForWho, MethodAxis, Offer, SecHead } from "./Sections";

export function Landing(props: { onStart: () => void; onSaved?: () => void }) {
  const demo = useRef<HTMLDivElement>(null);

  // Parallax leve na prova visual do hero. Sem movimento com reduced motion.
  useEffect(() => {
    const el = demo.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => el.style.setProperty("--py", String(Math.min(window.scrollY, 900))));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const cta = (
    <button className="btn btn--primary btn--lg" onClick={props.onStart}>
      Comece seu 7-Day Build <Arrow />
    </button>
  );

  return (
    <div className="landing">
      <header className="topbar wrap">
        <span className="wordmark topbar__mark">ALPHA</span>
        <Link className="btn btn--quiet" href="/entrar">
          Já comprou? Entrar
        </Link>
      </header>

      {/* ---------- HERO ---------- */}
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
          <p className="hero__lead enter" style={{ "--i": 4 } as CSSProperties}>
            Construa uma oferta digital pronta para testar no mercado em 7 dias.
          </p>
          <p className="hero__sub enter" style={{ "--i": 5 } as CSSProperties}>
            Não é mais um curso. Um dia, uma construção, um entregável.
          </p>
          <div className="hero__actions enter" style={{ "--i": 6 } as CSSProperties}>
            {cta}
            <span className="caption">3 perguntas para montar sua rota.</span>
          </div>
          <p className="hero__price enter" style={{ "--i": 7 } as CSSProperties}>
            <span className="num">{OFFER.priceLabel}</span>
            <span>Pagamento único · Acesso imediato</span>
          </p>
          {props.onSaved && (
            <button className="btn btn--quiet hero__saved enter" style={{ "--i": 8 } as CSSProperties} onClick={props.onSaved}>
              Ver minha rota salva →
            </button>
          )}
        </div>
        <div className="hero__demo enter" style={{ "--i": 5 } as CSSProperties} ref={demo}>
          <BuildDemo />
        </div>
      </section>

      {/* ---------- PROBLEMA → ALTERNATIVA ---------- */}
      <section className="pitch wrap">
        <Reveal>
          <h2 className="pitch__problem">
            Você consome muito.
            <br />
            <span>Constrói pouco.</span>
          </h2>
        </Reveal>
        <Reveal i={1} className="pitch__body">
          <Chains />
          <p className="pitch__alt">7 dias. 1 construção. Execução real.</p>
          <p>Cada dia termina com um entregável. O que você constrói hoje é a base de amanhã.</p>
        </Reveal>
      </section>

      {/* ---------- MÉTODO ---------- */}
      <section className="block wrap">
        <SecHead n={1} label="O método" title="Sete dias. Cada um termina com um entregável." />
        <MethodAxis />
      </section>

      {/* ---------- O QUE VOCÊ CONSTRÓI ---------- */}
      <section className="block wrap">
        <SecHead n={2} label="O resultado" title="No final, você construiu:">
          <p>Oito partes de uma oferta real. Juntas, viram o seu First Market Test.</p>
        </SecHead>
        <BuiltList />
      </section>

      {/* ---------- A PORTA VAZIA (só texto) ---------- */}
      <section className="block wrap">
        <Reveal className="door-text">
          <p className="door-text__lead">
            Quase todo mundo escolhe construir mais uma coisa.
            <br />
            <span>A porta de conseguir clientes vive vazia.</span>
          </p>
          <p className="door-text__body">O 7-Day Build termina nela: no DAY 07, sua oferta vai para o mercado.</p>
        </Reveal>
      </section>

      {/* ---------- PARA QUEM ---------- */}
      <section className="block wrap">
        <SecHead n={3} label="Para quem" title="Feito para quem vai executar." />
        <ForWho />
      </section>

      {/* ---------- OFERTA ---------- */}
      <section className="block wrap">
        <Offer cta={<>{cta}<span className="caption">3 perguntas para montar sua rota.</span></>} />
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="block wrap">
        <SecHead n={4} label="Perguntas" title="Antes de começar." />
        <Faq />
      </section>

      <footer className="foot wrap">
        <span className="micro">BUILD THE LIFE YOU WANT</span>
      </footer>
    </div>
  );
}
