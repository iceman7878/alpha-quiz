"use client";

// BUILD CORE: decide entre WebGL e pôster, carrega o Three.js só depois da primeira pintura
// e nunca bloqueia texto, CTA ou LCP. O progresso chega de fora (scroll), sem re-render.

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { CoreHandle } from "./core-scene";

export type CoreApi = { setProgress(p: number): void };
type Mode = "poster" | "webgl";

function canUseWebGL(): boolean {
  const q = new URLSearchParams(location.search).get("core");
  if (q === "poster") return false;
  if (q === "webgl") return true;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (nav.connection?.saveData) return false;
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return false;
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export const BuildCore = forwardRef<CoreApi, { className?: string }>(function BuildCore(props, ref) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const core = useRef<CoreHandle | null>(null);
  const progress = useRef(0);
  const fixed = useRef<number | null>(null); // ?p=0|1 congela o estado (pôster, QA)
  const [mode, setMode] = useState<Mode>("poster");
  const [live, setLive] = useState(false);

  useImperativeHandle(ref, () => ({
    setProgress(p) {
      progress.current = p;
      box.current?.style.setProperty("--core-p", String(p));
      if (fixed.current === null) core.current?.setProgress(p);
    },
  }));

  useEffect(() => {
    if (!canUseWebGL()) return;
    setMode("webgl");
  }, []);

  useEffect(() => {
    if (mode !== "webgl" || !canvas.current) return;
    let alive = true;
    const el = canvas.current;
    const boot = async () => {
      try {
        await document.fonts?.ready;
        const { createCore } = await import("./core-scene");
        if (!alive) return;
        const font = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() || "ui-monospace";
        const small = innerWidth < 720;
        const h = createCore(el, { font, dpr: Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75), reduced: false, labelScale: small ? 1.6 : 1 });
        core.current = h;
        const q = new URLSearchParams(location.search).get("p");
        if (q !== null) {
          fixed.current = Number(q);
          (window as unknown as { __core?: CoreHandle }).__core = h;
        }
        h.setProgress(fixed.current ?? progress.current);
        h.intro();
        setLive(true);
      } catch {
        if (alive) setMode("poster"); // WebGL falhou: o pôster continua contando a mesma história
      }
    };
    // Depois da primeira pintura e com o navegador ocioso: nada disso compete com o LCP.
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const start = () => (idle ? idle(boot, { timeout: 1200 }) : window.setTimeout(boot, 300));
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    const lost = (e: Event) => {
      e.preventDefault();
      setMode("poster");
    };
    el.addEventListener("webglcontextlost", lost);
    return () => {
      alive = false;
      window.removeEventListener("load", start);
      el.removeEventListener("webglcontextlost", lost);
      core.current?.dispose();
      core.current = null;
    };
  }, [mode]);

  return (
    <div ref={box} className={`core${live ? " is-live" : ""} ${props.className ?? ""}`} aria-hidden>
      {/* Pôster: mesmo objeto, renderizado da própria cena. Placeholder do WebGL e versão estática. */}
      <img className="core__poster core__poster--a" src="/v2/core-0.webp" alt="" decoding="async" />
      <img className="core__poster core__poster--b" src="/v2/core-1.webp" alt="" decoding="async" loading="lazy" />
      {mode === "webgl" && <canvas ref={canvas} className="core__canvas" />}
    </div>
  );
});
