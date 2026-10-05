// BUILD CORE — cena WebGL (carregada sob demanda, só no navegador).
//
// Hipótese visual 01, "a coluna":
//   PLANTA      — 7 vagas desenhadas na medida exata da peça (rasgo da espinha + furo do tirante),
//                 anotadas 01 FIND … 07 LAUNCH. Na espinha, 7 travas abertas esperando.
//   ACÚMULO     — peças de consumo (curso, vídeo, thread…) chegam: cerâmica escura, tamanhos errados,
//                 fora de esquadro, sem rasgo, sem furo. Nada encaixa.
//   CONSTRUÇÃO  — o acúmulo sai. Cada lâmina entra na sua vaga como uma gaveta: o rasgo recebe a
//                 espinha, a peça assenta, a trava desce. A vaga desenhada some porque virou matéria.
//   COMPLETION  — com as 7 no lugar, o tirante atravessa os 7 furos alinhados e o conjunto aperta.
//                 Só existe porque todas estão certas: é isso que transforma pilha em sistema.
//
// Sem efeitos: só geometria, matéria, escala, luz e movimento. Sem loop contínuo: renderiza
// quando o progresso muda, no resize e na entrada.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { STAGES, P_MAX, clamp01, buildT, closeT, slabT } from "./core-timeline";

export type CoreHandle = {
  /** 0 planta · 1 acúmulo · 2.5 sete lâminas travadas · 3 sistema fechado. */
  setProgress(p: number): void;
  /** Entrada única: o desenho se faz de baixo para cima. */
  intro(): void;
  snapshot(type?: string): string;
  dispose(): void;
};

const OSSO = new THREE.Color("#e9e4db");
const LOOSE = ["CURSO", "VÍDEO", "THREAD", "PROMPT", "FERRAMENTA", "IDEIA"];

// Medidas da coluna (unidades arbitrárias; tudo deriva daqui).
// Proporção de instrumento, não de prédio: vão curto em relação à espessura.
const SLAB = { w: 2.05, d: 1.2, h: 0.1, gap: 0.225, gapClosed: 0.208 };
const SPINE = 0.07;
const SPINE_X = -SLAB.w / 2 + 0.22; // espinha na quina traseira esquerda: as lâminas ficam em balanço
const SPINE_Z = -SLAB.d / 2 + 0.2;
const ROD = 0.05;
const ROD_X = SLAB.w / 2 - 0.24; // tirante na quina oposta: a diagonal amarra o conjunto
const ROD_Z = SLAB.d / 2 - 0.2;
const COL_H = SLAB.gap * 6;
const SLIDE = 2.4; // a lâmina entra pela direita, ao longo do rasgo

// Peças soltas: tamanho errado, fora de esquadro. Determinístico (sem Math.random).
const PIECES = [
  { w: 1.55, d: 0.9, h: 0.12, x: -1.55, y: -1.05, z: 0.85, ry: 0.62, rz: 0.05, from: [-0.9, 0, 0] },
  { w: 2.05, d: 0.7, h: 0.07, x: 0.55, y: -1.42, z: 1.35, ry: -0.38, rz: -0.03, from: [0.9, 0, 0.3] },
  { w: 0.95, d: 1.1, h: 0.14, x: 2.25, y: -0.6, z: 0.4, ry: 0.95, rz: 0.08, from: [0.8, 0.2, 0] },
  { w: 1.3, d: 0.6, h: 0.06, x: -2.05, y: 0.35, z: -0.35, ry: -0.72, rz: -0.06, from: [-0.8, 0.1, 0] },
  { w: 1.75, d: 1.0, h: 0.1, x: 1.25, y: 1.05, z: -0.65, ry: 0.28, rz: 0.04, from: [0.7, 0.3, -0.2] },
  { w: 1.1, d: 0.8, h: 0.09, x: -0.75, y: -1.85, z: -0.25, ry: -1.12, rz: 0.02, from: [0, -0.6, 0.4] },
];

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIn = (t: number) => t * t * t;
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

/** Contorno da lâmina: retângulo com o rasgo da espinha (aberto à esquerda) e o furo do tirante. */
function slabShape(): THREE.Shape {
  const { w, d } = SLAB;
  const c = SPINE / 2 + 0.004; // folga mínima: a peça foi feita para esta espinha
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -d / 2);
  s.lineTo(w / 2, -d / 2);
  s.lineTo(w / 2, d / 2);
  s.lineTo(-w / 2, d / 2);
  s.lineTo(-w / 2, SPINE_Z + c);
  s.lineTo(SPINE_X + c, SPINE_Z + c);
  s.lineTo(SPINE_X + c, SPINE_Z - c);
  s.lineTo(-w / 2, SPINE_Z - c);
  s.closePath();
  const r = ROD / 2 + 0.006;
  const hole = new THREE.Path();
  hole.moveTo(ROD_X - r, ROD_Z - r);
  hole.lineTo(ROD_X - r, ROD_Z + r);
  hole.lineTo(ROD_X + r, ROD_Z + r);
  hole.lineTo(ROD_X + r, ROD_Z - r);
  hole.closePath();
  s.holes.push(hole);
  return s;
}

/** Extrusão no plano XZ, espessura em Y, centrada. */
function slabGeometry(shape: THREE.Shape, bevel: boolean): THREE.BufferGeometry {
  const b = bevel ? 0.006 : 0;
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: SLAB.h - b * 2,
    bevelEnabled: bevel,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 2,
  });
  g.rotateX(Math.PI / 2); // forma XY → planta XZ; extrusão vira -Y
  g.translate(0, SLAB.h / 2 - b, 0);
  return g;
}

/** Textura fina de grão para a rugosidade: cerâmica não é plástico liso. */
function grainTexture(size: number, streak: boolean): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const img = g.createImageData(size, size);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const rows = streak ? Array.from({ length: size }, () => rnd()) : null;
  for (let i = 0; i < size * size; i++) {
    const y = Math.floor(i / size);
    const v = streak ? 150 + rows![y] * 70 + rnd() * 20 : 140 + rnd() * 60;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Rótulo técnico (Geist Mono, caixa alta), como anotação de desenho. */
function label(text: string, font: string, opacity: number, scale = 1): THREE.Sprite {
  const pad = 8;
  const px = 44;
  const c = document.createElement("canvas");
  const g = c.getContext("2d")!;
  g.font = `400 ${px}px ${font}`;
  const spaced = text.split("").join(String.fromCharCode(8202)); // tracking largo
  const w = Math.ceil(g.measureText(spaced).width) + pad * 2;
  c.width = w;
  c.height = px + pad * 2;
  g.font = `400 ${px}px ${font}`;
  g.fillStyle = "#e9e4db";
  g.textBaseline = "middle";
  g.fillText(spaced, pad, c.height / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity, depthWrite: false, depthTest: false });
  const s = new THREE.Sprite(mat);
  const hWorld = 0.085 * scale;
  s.scale.set((hWorld * c.width) / c.height, hWorld, 1);
  s.center.set(0, 0.5);
  s.renderOrder = 10;
  return s;
}

/** Altura de cada nível: o conjunto aperta um pouco quando o tirante assenta. */
const levelY = (i: number, settle: number) => {
  const gap = lerp(SLAB.gap, SLAB.gapClosed, settle);
  return -(gap * 6) / 2 + i * gap;
};

export function createCore(canvas: HTMLCanvasElement, opts: { font: string; dpr: number; reduced: boolean; labelScale?: number }): CoreHandle {
  const ls = opts.labelScale ?? 1;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(opts.dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.32;

  // Câmera teleobjetiva: pouca distorção, leitura de objeto de produto, não de maquete.
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
  camera.position.set(8.6, 5.4, 11.4);
  camera.lookAt(0, -0.15, 0);

  // Luz: uma chave de cima/esquerda (osso), um contraluz frio baixo (a cor --contraluz da marca).
  const key = new THREE.DirectionalLight("#f3eee4", 2.6);
  key.position.set(-3.5, 6, 3.2);
  scene.add(key);
  const rim = new THREE.DirectionalLight("#5a6474", 1.4);
  rim.position.set(4, -1.5, -5);
  scene.add(rim);

  const root = new THREE.Group();
  root.rotation.y = -0.18;
  scene.add(root);

  // ---------- materiais ----------
  const ceramicRough = grainTexture(256, false);
  ceramicRough.repeat.set(3, 3);
  const ceramic = () =>
    new THREE.MeshPhysicalMaterial({
      color: "#19191c",
      roughness: 0.58,
      roughnessMap: ceramicRough,
      metalness: 0,
      clearcoat: 0.22,
      clearcoatRoughness: 0.42,
      transparent: true,
      opacity: 0,
    });
  const brushed = grainTexture(256, true);
  brushed.repeat.set(1, 6);
  // Lâmina construída: o mesmo metal usinado da espinha. Peça certa = parte do sistema.
  const brushedSlab = brushed.clone();
  brushedSlab.repeat.set(0.35, 2.2);
  const built = () =>
    new THREE.MeshStandardMaterial({ color: "#c4beb3", metalness: 1, roughness: 0.32, roughnessMap: brushedSlab, transparent: true, opacity: 0 });
  const metal = new THREE.MeshStandardMaterial({ color: "#a9a397", metalness: 1, roughness: 0.34, roughnessMap: brushed, transparent: true, opacity: 0 });
  const rodMetal = metal.clone();

  // ---------- espinha ----------
  const spine = new THREE.Mesh(new RoundedBoxGeometry(SPINE, COL_H + 0.62, SPINE, 2, 0.008), metal);
  spine.position.set(SPINE_X, 0, SPINE_Z);
  root.add(spine);

  // ---------- planta, lâminas e travas ----------
  const shape = slabShape();
  const flat = slabGeometry(shape, false);
  const outlineGeo = new THREE.EdgesGeometry(flat, 30);
  flat.dispose();
  const slabGeo = slabGeometry(shape, true);
  const collarGeo = new RoundedBoxGeometry(SPINE + 0.07, 0.045, SPINE + 0.07, 2, 0.006);

  const levels = STAGES.map((name, i) => {
    const line = new THREE.LineSegments(outlineGeo, new THREE.LineBasicMaterial({ color: OSSO, transparent: true, opacity: 0 }));
    root.add(line);
    const mat = built();
    const slab = new THREE.Mesh(slabGeo, mat);
    slab.visible = false;
    root.add(slab);
    const collar = new THREE.Mesh(collarGeo, metal);
    root.add(collar);
    // marca de cota: da quina frontal direita para fora, e o rótulo na ponta
    const tickGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(SLAB.w / 2, 0, SLAB.d / 2), new THREE.Vector3(SLAB.w / 2 + 0.44, 0, SLAB.d / 2 + 0.12)]);
    const tick = new THREE.Line(tickGeo, new THREE.LineBasicMaterial({ color: OSSO, transparent: true, opacity: 0 }));
    root.add(tick);
    const tag = label(`${String(i + 1).padStart(2, "0")} ${name}`, opts.font, 0, ls);
    root.add(tag);
    return { line, slab, mat, collar, tick, tag };
  });

  // ---------- tirante ----------
  const ROD_LEN = SLAB.gapClosed * 6 + 0.42; // medido para o conjunto fechado
  const rod = new THREE.Mesh(new RoundedBoxGeometry(ROD, ROD_LEN, ROD, 2, 0.006), rodMetal);
  rod.visible = false;
  root.add(rod);

  // ---------- peças soltas ----------
  const pieces = PIECES.map((p, i) => {
    const mat = ceramic();
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(p.w, p.h, p.d, 2, 0.012), mat);
    mesh.rotation.set(0, p.ry, p.rz);
    root.add(mesh);
    const tag = label(LOOSE[i], opts.font, 0, ls);
    root.add(tag);
    return { p, mesh, mat, tag };
  });

  // ---------- estado ----------
  let progress = 0;
  let introT = opts.reduced ? 1 : 0; // 0→1 na entrada
  let w = 0;
  let h = 0;

  function layout() {
    const r = canvas.getBoundingClientRect();
    if (r.width === w && r.height === h) return;
    w = r.width;
    h = r.height;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function apply() {
    const P = progress;
    const arrive = clamp01(P); // 0→1 do acúmulo
    const c = buildT(P);
    const k = closeT(P);
    const settle = easeOut(seg(k, 0.68, 1));

    metal.opacity = easeOut(clamp01(introT * 1.4));
    metal.transparent = metal.opacity < 1;

    levels.forEach((L, i) => {
      const draw = easeOut(clamp01(introT * 1.6 - i * 0.09)); // entrada do desenho
      const t = slabT(P, i);
      const slide = easeOut(seg(t, 0, 0.78)); // gaveta: rápida no começo, longa desaceleração
      const seat = easeOut(seg(t, 0.78, 0.9)); // assenta no nível
      const lock = easeOut(seg(t, 0.84, 1)); // trava desce
      const y = levelY(i, settle);

      // vaga desenhada: some quando a matéria ocupa o lugar
      (L.line.material as THREE.LineBasicMaterial).opacity = 0.34 * draw * (1 - seg(t, 0.7, 0.95));
      L.line.position.set(0, y, 0);

      L.slab.visible = t > 0.001;
      L.slab.position.set(SLIDE * (1 - slide), y + 0.05 * (1 - seat), 0);
      L.mat.opacity = easeOut(seg(t, 0, 0.3));
      L.mat.transparent = L.mat.opacity < 1;
      L.mat.depthWrite = !L.mat.transparent;

      // trava: aberta (alta) na planta, desce sobre a lâmina
      const top = y + SLAB.h / 2 + 0.0225;
      L.collar.position.set(SPINE_X, lerp(top + 0.12, top, lock), SPINE_Z);

      L.tick.position.y = y;
      (L.tick.material as THREE.LineBasicMaterial).opacity = 0.22 * draw;
      L.tag.position.set(SLAB.w / 2 + 0.49, y, SLAB.d / 2 + 0.12);
      const idle = 0.5 * (1 - arrive * 0.45);
      (L.tag.material as THREE.SpriteMaterial).opacity = draw * lerp(idle, 0.82, lock);
    });

    // Tirante: só desce quando as 7 estão no lugar. Pesado: acelera e para seco no fundo.
    const drop = easeInOut(seg(k, 0, 0.7));
    // posicionado pelo topo: atravessa de cima; o aperto final faz a ponta sair embaixo
    const rodTop = levelY(6, settle) + 0.3 + 3 * (1 - drop);
    rod.visible = k > 0.001;
    rod.position.set(ROD_X, rodTop - ROD_LEN / 2, ROD_Z);
    rodMetal.opacity = easeOut(seg(k, 0, 0.18));
    rodMetal.transparent = rodMetal.opacity < 1;

    // Acúmulo: chega por um eixo só; na construção é retirado, peça por peça.
    pieces.forEach(({ p, mesh, mat, tag }, i) => {
      const t = easeOut(clamp01(arrive * 1.7 - i * 0.12));
      const e = easeIn(clamp01((c - i * 0.035) / 0.2));
      const k1 = 1 - t + e * 1.6;
      mesh.position.set(p.x + p.from[0] * k1, p.y + p.from[1] * k1 - 0.35 * e, p.z + p.from[2] * k1);
      mat.opacity = t * (1 - e);
      mat.transparent = mat.opacity < 1;
      mesh.visible = mat.opacity > 0.001;
      tag.position.set(mesh.position.x + 0.08, mesh.position.y + p.h / 2 + 0.11, mesh.position.z + p.d / 2);
      (tag.material as THREE.SpriteMaterial).opacity = 0.42 * mat.opacity;
      tag.visible = mesh.visible;
    });

    // Ordem: o giro do acúmulo volta para um ângulo calmo; o objeto ganha um pouco de escala.
    const o = easeInOut(c);
    root.rotation.y = lerp(-0.18 + arrive * 0.22, -0.06, o);
    root.position.y = lerp(arrive * 0.18, 0, o) - 0.025 * settle;
    const zoom = 1 + 0.2 * o;
    if (camera.zoom !== zoom) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
  }

  function render() {
    layout();
    apply();
    renderer.render(scene, camera);
  }

  let raf = 0;
  let introRaf = 0; // separado: um resize no meio da entrada não pode cancelá-la
  const schedule = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(render);
  };

  const ro = new ResizeObserver(schedule);
  ro.observe(canvas);
  render();

  return {
    setProgress(p) {
      const next = Math.min(P_MAX, Math.max(0, p));
      if (Math.abs(next - progress) < 0.0005) return;
      progress = next;
      schedule();
    },
    intro() {
      if (opts.reduced) return schedule();
      const t0 = performance.now();
      const dur = 1500;
      const step = (now: number) => {
        introT = clamp01((now - t0) / dur);
        render();
        if (introT < 1) introRaf = requestAnimationFrame(step);
      };
      introRaf = requestAnimationFrame(step);
    },
    snapshot(type = "image/webp") {
      render();
      return canvas.toDataURL(type, 0.86);
    },
    dispose() {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(introRaf);
      ro.disconnect();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((mm) => {
          (mm as THREE.MeshStandardMaterial).map?.dispose();
          mm.dispose();
        });
      });
      ceramicRough.dispose();
      brushed.dispose();
      brushedSlab.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
