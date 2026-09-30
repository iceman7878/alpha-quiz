"use client";

// Demonstração viva do produto no hero: o DAY 03 sendo construído, campo a campo,
// até o Artefato selar. Mostra a experiência em vez de descrevê-la.

import { useEffect, useState } from "react";
import { Artifact, Rail, Tick } from "../ui";

const FIELDS = [
  { label: "Quem compra", value: "Clínicas de estética de SP" },
  { label: "Resultado", value: "Responder pacientes em até 1 minuto" },
  { label: "Mecanismo", value: "Atendimento com IA treinado em 48h" },
];
const TYPE_MS = 34;
const HOLD_MS = 2600;

export function BuildDemo() {
  const [chars, setChars] = useState<number[]>(FIELDS.map((f) => f.value.length));
  const [sealed, setSealed] = useState(true);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let alive = true;
    const timers: number[] = [];
    const wait = (ms: number) => new Promise<void>((r) => timers.push(window.setTimeout(r, ms)));

    async function loop() {
      while (alive) {
        setSealed(false);
        setChars(FIELDS.map(() => 0));
        await wait(500);
        for (let f = 0; f < FIELDS.length && alive; f++) {
          for (let c = 1; c <= FIELDS[f].value.length && alive; c++) {
            setChars((prev) => prev.map((v, i) => (i === f ? c : v)));
            await wait(TYPE_MS);
          }
          await wait(260);
        }
        if (!alive) return;
        setSealed(true);
        await wait(HOLD_MS);
      }
    }
    const start = window.setTimeout(loop, 900);
    return () => {
      alive = false;
      window.clearTimeout(start);
      timers.forEach(window.clearTimeout);
    };
  }, []);

  const low = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
  const output = `Eu ajudo ${low(FIELDS[0].value)} a ${low(FIELDS[1].value)}, com ${low(FIELDS[2].value)}.`;
  const typing = chars.findIndex((c, i) => c < FIELDS[i].value.length);

  return (
    <div className="demo" aria-label="Demonstração: o DAY 03 sendo construído dentro do app" role="img">
      <div className="demo__bar">
        <span className="demo__day">DAY 03 — OFFER</span>
        <span className="demo__count num">03 / 07</span>
      </div>
      <Rail
        ariaLabel="Progresso da demonstração"
        progress={2 / 6}
        nodes={Array.from({ length: 7 }, (_, i) => ({ label: `0${i + 1}`, done: i < 2, current: i === 2 }))}
      />
      <div className="demo__fields" aria-hidden>
        {FIELDS.map((f, i) => {
          const full = chars[i] >= f.value.length;
          return (
            <div key={f.label} className={`demo__fld${full ? " is-filled" : ""}${typing === i ? " is-typing" : ""}`}>
              <span className="demo__lbl">
                <span className="num">0{i + 1}</span> {f.label}
                <Tick className="demo__tick" />
              </span>
              <span className="demo__val">
                {f.value.slice(0, chars[i])}
                {typing === i && <span className="demo__caret" />}
              </span>
            </div>
          );
        })}
      </div>
      <Artifact title="Minha oferta" sealed={sealed} state={sealed ? "Artefato construído" : "Em construção"} className="demo__artifact">
        <p className={`artifact__body demo__out${sealed ? " is-on" : ""}`}>{output}</p>
      </Artifact>
    </div>
  );
}
