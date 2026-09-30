"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame } from "@/components/area";
import { Arrow } from "@/components/ui";
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
    <AuthFrame
      title={mode === "login" ? "Welcome back." : "Nova senha."}
      lead={
        demo
          ? "Modo demonstração: o Supabase ainda não está configurado. Entre sem senha para ver a área."
          : mode === "login"
            ? "Entre para continuar o seu build."
            : "Informe o e-mail da compra. Enviamos um link para criar uma nova senha."
      }
    >
      <form className="auth__form" onSubmit={submit} noValidate>
        {!demo && (
          <label className="box">
            <span>E-mail da compra</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" autoComplete="email" />
          </label>
        )}
        {!demo && mode === "login" && (
          <label className="box">
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
          <p className="alert" role="status">
            {msg}
          </p>
        )}
        <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={busy}>
          {busy ? "Aguarde…" : demo ? "Entrar na demonstração" : mode === "login" ? "Entrar" : "Enviar link"}{" "}
          {!busy && <Arrow />}
        </button>
      </form>
      {!demo && (
        <button
          className="btn btn--quiet auth__switch"
          onClick={() => {
            setMsg("");
            setMode(mode === "login" ? "reset" : "login");
          }}
        >
          {mode === "login" ? "Esqueci minha senha" : "← Voltar para entrar"}
        </button>
      )}
    </AuthFrame>
  );
}
