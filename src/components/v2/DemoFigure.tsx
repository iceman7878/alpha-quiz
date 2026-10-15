"use client";

// 06 — o DAY 03 como peça de produto: a interface real (BuildDemo, intocada) sobre uma placa, com
// notas técnicas apontando para as três partes do dia. No desktop cada nota segue a altura real da
// parte que descreve (medida, porque os campos mudam de altura enquanto digitam); no mobile viram
// uma legenda abaixo da placa.

import { useEffect, useRef } from "react";
import { BuildDemo } from "../funnel/BuildDemo";

const NOTES = [
  { sel: ".rail", k: "Trilha", t: "O DAY 03 dentro dos 7. Os dias anteriores ficam construídos." },
  { sel: ".demo__fields", k: "Campos do dia", t: "Três decisões, com salvamento automático." },
  { sel: ".demo__artifact", k: "Artefato", t: "O entregável do dia. Fecha quando os campos estão completos." },
];

export function DemoFigure() {
  const plate = useRef<HTMLDivElement>(null);
  const notes = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const p = plate.current;
    const list = notes.current;
    if (!p || !list || !("ResizeObserver" in window)) return;
    const place = () => {
      const top = p.getBoundingClientRect().top;
      NOTES.forEach((n, i) => {
        const el = p.querySelector<HTMLElement>(n.sel);
        const li = list.children[i] as HTMLElement | undefined;
        if (!el || !li) return;
        const r = el.getBoundingClientRect();
        li.style.setProperty("--y", `${Math.round(r.top - top + r.height / 2)}px`);
      });
    };
    const ro = new ResizeObserver(place);
    ro.observe(p);
    place();
    return () => ro.disconnect();
  }, []);

  return (
    <div className="v2-demo__fig">
      <div className="v2-demo__plate" ref={plate}>
        <BuildDemo />
      </div>
      <ol className="v2-demo__notes" ref={notes}>
        {NOTES.map((n, i) => (
          <li key={n.k}>
            <span className="label">
              <span className="num">0{i + 1}</span> {n.k}
            </span>
            <span className="v2-demo__note">{n.t}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
