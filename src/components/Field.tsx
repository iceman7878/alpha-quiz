// Campo de propagação: arcos concêntricos que perdem intensidade sem perder ordem.
// A intensidade acompanha o ritmo do funil: presente na abertura, quieto nas perguntas,
// protagonista no diagnóstico, quase ausente na captura. Resultado e área não usam.

export type FieldVariant = "wide" | "quiet" | "origin" | "whisper";

const CENTERS: Record<FieldVariant, { cx: number; cy: number; opacity: number }> = {
  wide: { cx: 360, cy: 120, opacity: 1 },
  quiet: { cx: 420, cy: -40, opacity: 0.4 },
  origin: { cx: 330, cy: 92, opacity: 0.8 },
  whisper: { cx: 420, cy: -40, opacity: 0.18 },
};

const RINGS = Array.from({ length: 11 }, (_, i) => 36 + i * i * 7 + i * 22);

export function Field({ variant }: { variant: FieldVariant }) {
  const c = CENTERS[variant];
  return (
    <svg className="field" viewBox="0 0 400 800" preserveAspectRatio="xMaxYMin slice" aria-hidden>
      <g className="field__rings" style={{ opacity: c.opacity }}>
        {RINGS.map((r, i) => (
          <circle
            key={r}
            cx={c.cx}
            cy={c.cy}
            r={r}
            fill="none"
            stroke="var(--osso)"
            strokeWidth={0.6}
            strokeOpacity={Math.max(0.015, 0.12 - i * 0.01)}
          />
        ))}
      </g>
    </svg>
  );
}

/** Símbolo ALPHA: anel fino com ponto sólido ao centro. Nunca na mesma tela que o wordmark. */
export function Origin({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-label="ALPHA" role="img">
      <circle cx="20" cy="20" r="17" fill="none" stroke="var(--osso)" strokeWidth="1" />
      <circle cx="20" cy="20" r="3" fill="var(--osso)" />
    </svg>
  );
}
