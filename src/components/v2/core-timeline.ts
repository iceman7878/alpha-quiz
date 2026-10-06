// Linha do tempo do BUILD CORE — compartilhada entre a cena (lazy, Three.js) e a página (readout).
// Sem dependências: entra no bundle inicial sem custo.
//
//   P 0 → 1   PLANTA → ACÚMULO        peças de consumo chegam, nenhuma encaixa
//   P 1 → 2.5 CONSTRUÇÃO              o acúmulo sai; as 7 lâminas entram na medida e travam
//   P 2.5 → 3 COMPLETION              o tirante atravessa as 7 e o conjunto assenta

export const STAGES = ["FIND", "PROBLEM", "OFFER", "MVP", "POSITION", "DISTRIBUTION", "LAUNCH"] as const;
export const P_MAX = 3;

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Acúmulo: cada peça de consumo chega na sua vez, ao longo de toda a seção 02 (sem tela morta). */
export const PIECE_N = 6;
export const pieceT = (P: number, i: number) => clamp01((P - (0.06 + i * 0.13)) / 0.2);
/** Quantas peças de consumo já chegaram (sincroniza a lista "Cursos. Vídeos. …"). */
export const arrivedAt = (P: number) => Array.from({ length: PIECE_N }).reduce<number>((n, _, i) => n + (pieceT(P, i) >= 0.5 ? 1 : 0), 0);

/** 0→1 da construção. */
export const buildT = (P: number) => clamp01((P - 1) / 1.5);
/** 0→1 do fechamento. */
export const closeT = (P: number) => clamp01((P - 2.5) / 0.5);

/** Janela de cada lâmina dentro da construção: uma depois da outra, sem sobreposição longa. */
export const slabT = (P: number, i: number) => clamp01((buildT(P) - (0.1 + i * 0.118)) / 0.19);

/** Quantas lâminas já travaram. */
export const lockedAt = (P: number) => STAGES.reduce((n, _, i) => n + (slabT(P, i) >= 1 ? 1 : 0), 0);

export type Phase = "PLANTA" | "ACÚMULO" | "CONSTRUÇÃO" | "COMPLETE";
export function phaseAt(P: number): Phase {
  if (closeT(P) >= 1) return "COMPLETE";
  if (P > 1.05) return "CONSTRUÇÃO";
  return P > 0.5 ? "ACÚMULO" : "PLANTA";
}
