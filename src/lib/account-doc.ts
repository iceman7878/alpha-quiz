// CPF/CNPJ do comprador, usado só para ligar o pagamento à conta quando o checkout não devolve o externalId.
// O payload oficial da Disrupty (docs/webhook, Gateway v6.7.0) traz `customerEmail` e `customerDocument`, mas não o
// externalId do link. Por isso a conta guarda um HMAC do documento (nunca o documento) em app_metadata.doc_hash, e o
// webhook libera a conta cujo e-mail E documento batem com os da venda. Só o e-mail não basta para tomar a compra de ninguém.
//
// ACCOUNT_DOC_PEPPER (Vercel, sensível): chave do HMAC. Trocar a chave invalida os hashes já gravados.

import { createHmac } from "node:crypto";

export const docDigits = (v: unknown) => String(v ?? "").replace(/\D/g, "");

function cpfOk(d: string): boolean {
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  const dv = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += Number(d[i]) * (len + 1 - i);
    const r = (s * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

function cnpjOk(d: string): boolean {
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const dv = (len: number) => {
    const w = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const s = w.reduce((acc, wi, i) => acc + Number(d[i]) * wi, 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === Number(d[12]) && dv(13) === Number(d[13]);
}

/** CPF ou CNPJ válido (só dígitos). */
export const validDoc = (d: string) => cpfOk(d) || cnpjOk(d);

/** HMAC-SHA256 do documento (só dígitos). Vazio se faltar documento ou chave. */
export function docHash(digits: string, pepper: string): string {
  if (!digits || !pepper) return "";
  return createHmac("sha256", pepper).update(digits, "utf8").digest("hex");
}
