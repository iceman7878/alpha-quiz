"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthFrame } from "@/components/area";
import { Arrow } from "@/components/ui";
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
    <AuthFrame title="Seu acesso ao ALPHA LAUNCH está pronto." lead="Crie sua senha para entrar no 7-Day Build.">
      <form className="auth__form" onSubmit={submit} noValidate>
        <label className="box">
          <span>Senha</span>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        </label>
        <label className="box">
          <span>Repita a senha</span>
          <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
        </label>
        {msg && (
          <p className="alert" role="alert">
            {msg}
          </p>
        )}
        <button className="btn btn--primary btn--block btn--lg" type="submit" disabled={busy}>
          {busy ? "Salvando…" : "Criar senha e entrar"} {!busy && <Arrow />}
        </button>
      </form>
    </AuthFrame>
  );
}
