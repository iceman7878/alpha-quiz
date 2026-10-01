"use client";

// Componentes próprios da ALPHA: Rail, Artefato, Mapa de rotas, Reveal, Copy, estado de salvamento.

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { ROUTES, type RouteKey } from "@/lib/quiz";

const pad = (n: number) => String(n).padStart(2, "0");

/** Troca de tela com a View Transitions API (nativa). Sem suporte ou com reduced motion: troca direta. */
export function screenTransition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!doc.startViewTransition || reduced) return update();
  doc.startViewTransition(() => flushSync(update));
}

// ---------- RAIL ----------

export type RailNode = { label: string; done: boolean; current: boolean; href?: string; title?: string };

/** A sequência: marcos sobre uma linha. `progress` = fração preenchida (0–1). */
export function Rail(props: { nodes: RailNode[]; progress: number; labels?: boolean; className?: string; ariaLabel: string }) {
  const style = { "--rail-n": props.nodes.length, "--rail-p": props.progress } as CSSProperties;
  return (
    <nav className={`railbox ${props.className ?? ""}`} aria-label={props.ariaLabel}>
      <ol className="rail" style={style}>
        <li className="rail__fill" aria-hidden />
        {props.nodes.map((n) => {
          const cls = `rail__node${n.done ? " is-done" : ""}${n.current ? " is-current" : ""}`;
          const title = n.title ?? n.label;
          return (
            <li key={n.label} className={cls}>
              {n.href ? (
                <Link href={n.href} aria-label={title} aria-current={n.current ? "step" : undefined} title={title}>
                  <i />
                </Link>
              ) : (
                <span aria-label={title} aria-current={n.current ? "step" : undefined}>
                  <i />
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {props.labels && (
        <ol className="rail__labels" style={{ "--rail-n": props.nodes.length } as CSSProperties} aria-hidden>
          {props.nodes.map((n) => (
            <li key={n.label} className={n.current ? "is-current" : n.done ? "is-done" : ""}>
              {n.label}
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}

// ---------- ARTEFATO ----------

export function Artifact(props: {
  title: string;
  children: ReactNode;
  sealed?: boolean;
  state?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`artifact${props.sealed ? " is-sealed" : ""} ${props.className ?? ""}`}>
      <span className="artifact__marks" aria-hidden />
      <header className="artifact__head">
        <span className="artifact__title">{props.title}</span>
        {props.action}
      </header>
      {props.children}
      {props.state && (
        <footer className="artifact__foot">
          <span className="artifact__state">{props.state}</span>
        </footer>
      )}
    </section>
  );
}

// ---------- MAPA DE ROTAS ----------

const MAP_ORDER: RouteKey[] = ["servico", "produto", "bastidor", "distribuicao"];

/** Origem à esquerda; quatro rotas se abrem; a escolhida acende. */
export function RouteMap(props: { picked: RouteKey | null; draw?: boolean; className?: string }) {
  const ys = [22, 70, 118, 166];
  return (
    <svg
      className={`routemap${props.draw ? " routemap--draw" : ""} ${props.className ?? ""}`}
      viewBox="0 0 420 188"
      role="img"
      aria-label={props.picked ? `Rota escolhida: ${ROUTES[props.picked].name}` : "Mapa das quatro rotas"}
    >
      {MAP_ORDER.map((k, i) => {
        const y = ys[i];
        const picked = props.picked === k;
        return (
          <g key={k} className={picked ? "is-picked" : ""} style={{ "--i": i } as CSSProperties}>
            <path d={`M 12 94 C 110 94, 130 ${y}, 236 ${y} L 262 ${y}`} pathLength={1} />
            <rect x={262} y={y - 3.5} width={7} height={7} />
            <text x={280} y={y + 4}>
              {pad(Number(ROUTES[k].code))} {ROUTES[k].name}
            </text>
          </g>
        );
      })}
      <rect className="origin" x={8.5} y={90.5} width={7} height={7} />
    </svg>
  );
}

// ---------- DUAS PORTAS ----------

// Conseguir clientes (vazia, um marco) × construir mais uma coisa (a multidão).
// Mesma gramática do mapa de rotas: linha fina, marcos quadrados, a escolha certa em osso.
const CROWD = Array.from({ length: 6 * 9 }, (_, i) => ({ x: 236 + (i % 9) * 19 + (Math.floor(i / 9) % 2) * 6, y: 112 + Math.floor(i / 9) * 15 }));

export function TwoDoors(props: { className?: string }) {
  return (
    <svg
      className={`doors ${props.className ?? ""}`}
      viewBox="0 0 420 210"
      role="img"
      aria-label="Duas portas: conseguir clientes, quase vazia; construir mais uma coisa, com uma multidão na fila."
    >
      <line className="doors__ground" x1="0" y1="200" x2="420" y2="200" />
      <g className="doors__door doors__door--open">
        <path d="M 40 200 V 44 H 150 V 200" pathLength={1} />
        <text x="95" y="30">Conseguir clientes</text>
        <rect className="doors__one" x="90.5" y="178" width="9" height="9" />
      </g>
      <g className="doors__door">
        <path d="M 262 200 V 44 H 372 V 200" pathLength={1} />
        <text x="317" y="30">Construir mais uma coisa</text>
        {CROWD.map((c, i) => (
          <rect key={i} className="doors__crowd" x={c.x} y={c.y} width="7" height="7" />
        ))}
      </g>
    </svg>
  );
}

// ---------- REVEAL ----------

/** Revela uma vez ao entrar na tela. Sem JS/IO: aparece direto. */
export function Reveal(props: { children: ReactNode; i?: number; as?: "div" | "section" | "li"; className?: string }) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return setInView(true);
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const Tag = props.as ?? "div";
  return (
    <Tag
      ref={ref as never}
      className={`reveal${inView ? " is-in" : ""} ${props.className ?? ""}`}
      style={{ "--i": props.i ?? 0 } as CSSProperties}
    >
      {props.children}
    </Tag>
  );
}

// ---------- COPY ----------

export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`copy${done ? " is-done" : ""}`}
      aria-live="polite"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const t = document.createElement("textarea");
          t.value = text;
          document.body.appendChild(t);
          t.select();
          document.execCommand("copy");
          t.remove();
        }
        setDone(true);
        window.setTimeout(() => setDone(false), 1600);
      }}
    >
      {done ? "Copiado" : label}
    </button>
  );
}

// ---------- ÍCONES MÍNIMOS ----------

export function Tick({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 14" aria-hidden>
      <path d="M2.5 7.5 L5.5 10.5 L11.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function Arrow() {
  return (
    <span className="btn__arrow" aria-hidden>
      →
    </span>
  );
}
