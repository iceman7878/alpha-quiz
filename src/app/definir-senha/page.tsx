"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setPassword } from "@/lib/store";

/** Destino do link de convite (pós-compra) e do link de recuperação de senha. */
export default function DefinirSenhaPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setMsg("Use pelo menos 8 caracteres.");
    if (pw !== pw2) return setMsg("As senhas não conferem.");
    setBusy(true);
    const err = await setPassword(pw);
    setBusy(false);
    if (err) return setMsg(err);
    router.replace("/build");
  }

  return (
    <main className="stage">
      <div className="screen">
        <section className="login">
          <span className="micro">ACESSO</span>
          <h1 className="wordmark login__mark">ALPHA</h1>
          <h2 className="login__title">Seu acesso ao ALPHA LAUNCH está pronto.</h2>
          <p className="lead">Crie sua senha para entrar no 7-Day Build.</p>
          <form className="form" onSubmit={submit} noValidate>
            <label className="input">
              <span>Senha</span>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
            </label>
            <label className="input">
              <span>Repita a senha</span>
              <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
            </label>
            {msg && (
              <p className="form__error" role="alert">
                {msg}
              </p>
            )}
            <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
              {busy ? "Salvando…" : "Criar senha e entrar"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
