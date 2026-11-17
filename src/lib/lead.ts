// Linha da tabela `leads` a partir do lead do quiz. O quiz manda `perfil` (chave da rota);
// a coluna real é `rota` — gravar `perfil` fazia todo insert falhar no Supabase.

export type Lead = {
  nome: string;
  whatsapp: string;
  email?: string;
  perfil?: string;
  r?: string;
  utm?: Record<string, string>;
  consentimento: boolean;
};

export function leadRow(lead: Lead) {
  return {
    nome: lead.nome,
    whatsapp: lead.whatsapp,
    email: lead.email?.toLowerCase() ?? null,
    rota: lead.perfil ?? null,
    r: lead.r ?? null,
    utm: lead.utm ?? null,
    consentimento: lead.consentimento,
  };
}
