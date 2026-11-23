"use client";

// Passo antes do checkout: o comprador cria a conta (ou entra) e segue para a Disrupty com o id da conta em
// `externalId`. O webhook libera o acesso só para essa conta — sem e-mail de convite.

import { useEffect, useState } from "react";
import { AuthFrame } from "@/components/area";
import { Arrow } from "@/components/ui";
import { CHECKOUT_URL } from "@/config";
import { createAccount, currentUserId, signIn } from "@/lib/store";

function goToCheckout(userId: string) {
  const url = new URL(CHECKOUT_URL, window.location.origin);
  new URLSearchParams(window.location.search).forEach((v, k) => url.searchParams.set(k, v));
  url.searchParams.set("externalId", userId);
  window.location.href = url.toString();
}

export default function ComprarPage() {
  const [mode, setMode] = useState<"criar" | "entrar">("criar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    currentUserId().then((id) => (id ? goToCheckout(id) : setBusy(false)));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const mail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(mail)) return setMsg("Confira o e-mail.");
    if (password.length < 8) return setMsg("A senha precisa ter pelo menos 8 caracteres.");
    setBusy(true);
    const err = mode === "criar" ? await createAccount(mail, password, nome.trim()) : await signIn(mail, password);
    const id = err ? null : await currentUserId();
    if (!id) {
      setBusy(false);
      return setMsg(err || "Não foi possível entrar agora. Tente de novo.");
    }
    goToCheckout(id);
  }

  return (
    <AuthFrame
      title={mode === "criar" ? "Crie seu acesso." : "Entre para continuar."}
      lead={
        mode === "criar"
          ? "Seu login do ALPHA LAUNCH. Depois do pagamento, é com este e-mail e esta senha que você entra no DAY 01."
          : "Entre com a conta que vai receber o acesso."
      }
    >
      <form className="auth__form" onSubmit={submit} noValidate>
        {mode === "criar" && (
          <label className="box">
            <span>Nome</span>
            <input value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
          </label>
        )}
        <label className="box">
          <span>E-mail</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" autoComplete="email" />
        </label>
        <label className="box">
          <span>Senha (mín. 8 caracteres)</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "criar" ? "new-password" : "current-password"}
          />
        </label>
        {msg && (
          <p className="alert" role="status">
            {msg}
          </p>
        )}
        <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={busy}>
          {busy ? "Aguarde…" : "Continuar para o pagamento"} {!busy && <Arrow />}
        </button>
      </form>
      <button
        className="btn btn--quiet auth__switch"
        onClick={() => {
          setMsg("");
          setMode(mode === "criar" ? "entrar" : "criar");
        }}
      >
        {mode === "criar" ? "Já tenho conta" : "← Criar conta"}
      </button>
    </AuthFrame>
  );
}
