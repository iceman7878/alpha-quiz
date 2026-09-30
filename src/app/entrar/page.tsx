"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { isDemo, sendReset, signIn } from "@/lib/store";

export default function EntrarPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const demo = isDemo();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (!demo && !/^\S+@\S+\.\S+$/.test(email)) return setMsg("Confira o e-mail.");
    setBusy(true);
    if (mode === "login") {
      const err = await signIn(email.trim(), password);
      setBusy(false);
      if (err) return setMsg(err);
      router.replace("/build");
    } else {
      const err = await sendReset(email.trim());
      setBusy(false);
      setMsg(err || "Se este e-mail tiver acesso, o link para criar uma nova senha chega em instantes.");
    }
  }

  return (
    <main className="stage">
      <div className="screen">
        <section className="login">
          <span className="micro">ACESSO</span>
          <h1 className="wordmark login__mark">ALPHA</h1>
          <h2 className="login__title">{mode === "login" ? "Welcome back." : "Nova senha."}</h2>
          {demo && (
            <p className="lead">Modo demonstração: o Supabase ainda não está configurado. Entre sem senha para ver a área.</p>
          )}
          <form className="form" onSubmit={submit} noValidate>
            {!demo && (
              <label className="input">
                <span>E-mail da compra</span>
                <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" autoComplete="email" />
              </label>
            )}
            {!demo && mode === "login" && (
              <label className="input">
                <span>Senha</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </label>
            )}
            {msg && (
              <p className="form__error" role="status">
                {msg}
              </p>
            )}
            <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
              {busy ? "Aguarde…" : demo ? "Entrar na demonstração" : mode === "login" ? "Entrar" : "Enviar link"}
            </button>
          </form>
          {!demo && (
            <button
              className="back login__switch"
              onClick={() => {
                setMsg("");
                setMode(mode === "login" ? "reset" : "login");
              }}
            >
              {mode === "login" ? "Esqueci minha senha" : "← Voltar para entrar"}
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
