"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { BuildContent } from "@/lib/build";
import { currentEmail, isDemo, loadContent, loadMember, loadProgress, mode, signOut, type Member, type Progress } from "@/lib/store";

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

export function Shell({ children, back }: { children: React.ReactNode; back?: { href: string; label: string } }) {
  const router = useRouter();
  return (
    <main className="area">
      <header className="area__head">
        {back ? (
          <Link className="back" href={back.href}>
            ← {back.label}
          </Link>
        ) : (
          <span className="area__mark">ALPHA</span>
        )}
        <button
          className="back"
          onClick={async () => {
            await signOut();
            router.replace("/entrar");
          }}
        >
          Sair
        </button>
      </header>
      {isDemo() && <p className="demo-note">Modo demonstração — o progresso fica salvo só neste navegador.</p>}
      <div className="area__body">{children}</div>
    </main>
  );
}

export function AreaFallback({ state }: { state: AreaState }) {
  if (state.status === "misconfigured") {
    return (
      <main className="area">
        <div className="area__body area__center">
          <h1 className="area__title">Área em configuração.</h1>
          <p className="lead">Estamos finalizando a área de membros. Tente novamente em alguns minutos.</p>
        </div>
      </main>
    );
  }
  if (state.status === "noaccess") {
    return (
      <main className="area">
        <div className="area__body area__center">
          <h1 className="area__title">Acesso não encontrado.</h1>
          <p className="lead">
            Não encontramos uma compra ativa para este e-mail. Se você comprou com outro endereço, entre com ele — ou
            responda o e-mail da compra que resolvemos.
          </p>
          <div className="actions">
            <button
              className="btn btn--ghost"
              onClick={async () => {
                await signOut();
                window.location.href = "/entrar";
              }}
            >
              Entrar com outro e-mail
            </button>
          </div>
        </div>
      </main>
    );
  }
  return (
    <main className="area">
      <div className="area__body area__center">
        <div className="bar area__loading">
          <div className="bar__fill" />
        </div>
      </div>
    </main>
  );
}

export function CopyButton({ text, label = "Copiar" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className="copy"
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
