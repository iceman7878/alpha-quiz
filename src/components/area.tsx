"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { firstMarketTest, fmtText, renderOutput, type BuildContent, type Day } from "@/lib/build";
import { currentEmail, isDemo, loadContent, loadMember, loadProgress, mode, signOut, type Member, type Progress } from "@/lib/store";
import { CopyButton, Rail, Reveal } from "./ui";

export { CopyButton } from "./ui";

type AreaState =
  | { status: "loading" }
  | { status: "noaccess" }
  | { status: "misconfigured" }
  | { status: "ready"; member: Member; progress: Progress; content: BuildContent };

/** Guarda da área de membros: sem sessão → /entrar; sem compra ativa → aviso. */
export function useArea() {
  const router = useRouter();
  const [state, setState] = useState<AreaState>({ status: "loading" });

  const reload = useCallback(async () => {
    if (mode === "misconfigured") {
      setState({ status: "misconfigured" });
      return;
    }
    const email = await currentEmail();
    if (!email) {
      router.replace("/entrar");
      return;
    }
    const member = await loadMember();
    if (!member || !member.active) {
      setState({ status: "noaccess" });
      return;
    }
    const [progress, content] = await Promise.all([loadProgress(), loadContent()]);
    if (!content) {
      setState({ status: "noaccess" });
      return;
    }
    setState({ status: "ready", member, progress, content });
  }, [router]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { state, reload };
}

/** Rail de navegação dos 7 dias — sempre visível: onde estou, onde estive, quanto falta. */
export function DayRail(props: { progress: Progress; current?: number; labels?: boolean; className?: string }) {
  const days = [1, 2, 3, 4, 5, 6, 7];
  const done = days.filter((d) => props.progress[d]?.completed).length;
  const next = days.find((d) => !props.progress[d]?.completed);
  const current = props.current ?? next;
  return (
    <Rail
      className={props.className}
      ariaLabel="Os 7 dias do build"
      labels={props.labels}
      progress={Math.min(1, done / 6)}
      nodes={days.map((d) => ({
        label: `0${d}`,
        title: `DAY 0${d}`,
        done: !!props.progress[d]?.completed,
        current: d === current,
        href: `/build/dia/${d}`,
      }))}
    />
  );
}

export function Shell(props: {
  children: ReactNode;
  back?: { href: string; label: string };
  progress?: Progress;
  currentDay?: number;
}) {
  const router = useRouter();
  const done = props.progress ? Object.values(props.progress).filter((p) => p.completed).length : 0;
  return (
    <main className="area">
      <header className="area__head wrap">
        <div className="area__left">
          {props.back ? (
            <Link className="btn btn--quiet" href={props.back.href}>
              ← {props.back.label}
            </Link>
          ) : (
            <span className="wordmark area__mark">ALPHA</span>
          )}
        </div>
        {props.progress && (
          <div className="area__rail">
            <DayRail progress={props.progress} current={props.currentDay} />
            <span className="area__count num">
              {done}/7
            </span>
          </div>
        )}
        <div className="area__right">
          <button
            className="btn btn--quiet"
            onClick={async () => {
              await signOut();
              router.replace("/entrar");
            }}
          >
            Sair
          </button>
        </div>
      </header>
      {isDemo() && (
        <p className="demo-note wrap">
          <span>Modo demonstração — o progresso fica salvo só neste navegador.</span>
        </p>
      )}
      <div className="area__body wrap">{props.children}</div>
    </main>
  );
}

export function AreaFallback({ state }: { state: AreaState }) {
  if (state.status === "misconfigured" || state.status === "noaccess") {
    const noaccess = state.status === "noaccess";
    return (
      <main className="area">
        <div className="area__body area__center wrap">
          <span className="wordmark area__mark">ALPHA</span>
          <h1 className="h1">{noaccess ? "Acesso não encontrado." : "Área em configuração."}</h1>
          <p className="lead">
            {noaccess
              ? "Não encontramos uma compra ativa para este e-mail. Se você comprou com outro endereço, entre com ele — ou responda o e-mail da compra que resolvemos."
              : "Estamos finalizando a área de membros. Tente novamente em alguns minutos."}
          </p>
          {noaccess && (
            <button
              className="btn btn--ghost"
              onClick={async () => {
                await signOut();
                window.location.href = "/entrar";
              }}
            >
              Entrar com outro e-mail
            </button>
          )}
        </div>
      </main>
    );
  }
  return (
    <main className="area" aria-busy="true">
      <div className="area__body area__center wrap">
        <div className="loading" aria-label="Carregando">
          <span />
        </div>
      </div>
    </main>
  );
}

/** Moldura das telas de acesso (login, senha): monumento à esquerda, formulário à direita. */
export function AuthFrame(props: { title: string; lead?: string; children: ReactNode }) {
  return (
    <main className="auth">
      <div className="auth__side">
        <span className="micro">ACESSO</span>
        <span className="wordmark auth__mark">ALPHA</span>
        <span className="auth__line">7-Day Build · Discover → Build → Ship</span>
      </div>
      <section className="auth__main">
        <h1 className="h1 auth__title enter">{props.title}</h1>
        {props.lead && (
          <p className="lead enter" style={{ "--i": 1 } as React.CSSProperties}>
            {props.lead}
          </p>
        )}
        <div className="enter" style={{ "--i": 2 } as React.CSSProperties}>
          {props.children}
        </div>
      </section>
    </main>
  );
}

/** Nome de etapa de cada entregável no stack (o dia é a ação; o stack mostra o que ela gerou). */
const STAGE: Record<number, string> = {
  1: "DIRECTION",
  2: "PROBLEM",
  3: "OFFER",
  4: "MVP",
  5: "POSITION",
  6: "DISTRIBUTION",
  7: "LAUNCH",
};

/** YOUR BUILD: o blueprint do que foi construído — um eixo vertical, um estágio por dia, o output real de cada um. */
export function BuildStack(props: { days: Day[]; progress: Progress; className?: string }) {
  const done = props.days.filter((d) => props.progress[d.n]?.completed).length;
  return (
    <section className={`stack ${props.className ?? ""}`} aria-labelledby="stack-title">
      <header className="stack__head">
        <span className="label" id="stack-title">
          Your build
        </span>
        <span className="stack__count num">{done}/{props.days.length}</span>
      </header>
      {done === 0 && <p className="stack__empty">Cada dia concluído deixa um entregável aqui.</p>}
      <ol className="stack__list">
        {props.days.map((d) => {
          const p = props.progress[d.n];
          const num = String(d.n).padStart(2, "0");
          if (!p?.completed) {
            if (done === 0) return null;
            return (
              <li key={d.n} className="stack__item is-todo">
                <span className="stack__num num">{num}</span>
                <div className="stack__main">
                  <span className="stack__stage">{STAGE[d.n] ?? d.name}</span>
                </div>
              </li>
            );
          }
          const text = renderOutput(d.finalize, p.answers);
          return (
            <Reveal as="li" key={d.n} className="stack__item is-done">
              <span className="stack__num num">{num}</span>
              <div className="stack__main">
                <div className="stack__row">
                  <span className="stack__stage">
                    {STAGE[d.n] ?? d.name}
                    <span className="sr-only"> — concluído</span>
                  </span>
                  <CopyButton text={text} />
                </div>
                <pre className="stack__body">{text}</pre>
              </div>
            </Reveal>
          );
        })}
      </ol>
    </section>
  );
}

/** FIRST MARKET TEST: o documento final. Só aparece com o DAY 07 concluído; só usa o que a pessoa escreveu. */
export function FirstMarketTest(props: { progress: Progress; nome?: string | null; className?: string }) {
  if (!props.progress[7]?.completed) return null;
  const byDay = Object.fromEntries(Object.entries(props.progress).map(([k, v]) => [k, v?.answers]));
  const fmt = firstMarketTest(byDay);
  const text = fmtText(fmt, props.nome);
  return (
    <article className={`fmt ${props.className ?? ""}`} aria-labelledby="fmt-title">
      <header className="fmt__head">
        <span className="label">First market test</span>
        <h2 className="fmt__title" id="fmt-title">
          {props.nome ? `${props.nome}, este é o seu plano para testar no mercado.` : "Este é o seu plano para testar no mercado."}
        </h2>
        <p className="fmt__lead">Escrito por você, dia a dia. Da direção à primeira mensagem.</p>
      </header>

      <ol className="fmt__list">
        {fmt.sections.map((s) => (
          <Reveal as="li" key={s.n} className="fmt__sec">
            <span className="fmt__num num" aria-hidden>
              {String(s.n).padStart(2, "0")}
            </span>
            <div className="fmt__body">
              <h3 className="fmt__stage">
                <span className="label">{s.stage}</span>
                <span className="fmt__q">{s.question}</span>
              </h3>
              {s.lead.list && s.lead.value !== "…" ? (
                <ol className="fmt__people">
                  {s.lead.value.split("\n").map((l, i) => (
                    <li key={i}>
                      <span className="num">{String(i + 1).padStart(2, "0")}</span>
                      <span>{l}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={`fmt__lead-value${s.lead.value === "…" ? " is-empty" : ""}`}>{s.lead.value}</p>
              )}
              <dl className="fmt__rows">
                {s.rows.map((r) => (
                  <div key={r.label} className="fmt__row">
                    <dt>{r.label}</dt>
                    <dd className={r.value === "…" ? "is-empty" : undefined}>{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        ))}
      </ol>

      <Reveal className="fmt__next">
        <span className="label">Next move</span>
        <p className="fmt__move">
          Mande a mensagem para <strong>{fmt.firstPerson}</strong>.
          <br />
          Depois, as outras 9 até <strong>{fmt.review}</strong>.
        </p>
        <div className="fmt__copy">
          <CopyButton text={text} label="Copy build" />
          <span className="fmt__sign">ALPHA — BUILD THE LIFE YOU WANT</span>
        </div>
      </Reveal>
    </article>
  );
}
