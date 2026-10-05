// BUILD CORE — cena WebGL (carregada sob demanda, só no navegador).
//
// Hipótese visual 01, "a coluna":
//   PLANTA   — 7 vagas exatas (01 FIND … 07 LAUNCH) presas a uma espinha de metal. Só contorno.
//   SOLTO    — peças de consumo (curso, vídeo, thread…) chegam: cerâmica de verdade, mas de
//              tamanhos errados, fora de esquadro, sem encaixe. Acúmulo ≠ construção.
//   (fase 3) — as 7 lâminas são construídas na medida e travam nas vagas.
//
// Sem loop contínuo: renderiza só quando o progresso muda, no resize e na entrada.

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type CoreHandle = {
  /** 0 = planta (INCOMPLETE) · 1 = peças soltas (SOLTO). */
  setProgress(p: number): void;
  /** Entrada única: o contorno se desenha de baixo para cima. */
  intro(): void;
  snapshot(type?: string): string;
  dispose(): void;
};

const OSSO = new THREE.Color("#e9e4db");
const STAGES = ["FIND", "PROBLEM", "OFFER", "MVP", "POSITION", "DISTRIBUTION", "LAUNCH"];
const LOOSE = ["CURSO", "VÍDEO", "THREAD", "PROMPT", "FERRAMENTA", "IDEIA"];

// Medidas da coluna (unidades arbitrárias; tudo deriva daqui).
const SLAB = { w: 2.3, d: 1.25, h: 0.085, gap: 0.33 };
const SPINE_X = -SLAB.w / 2 + 0.22; // espinha perto da borda traseira esquerda: as lâminas ficam em balanço
const SPINE_Z = -SLAB.d / 2 + 0.2;
const COL_H = SLAB.gap * 6;

// Peças soltas: tamanho errado, fora de esquadro. Determinístico (sem Math.random).
const PIECES = [
  { w: 1.55, d: 0.9, h: 0.12, x: -1.55, y: -1.05, z: 0.85, ry: 0.62, rz: 0.05, from: [-0.9, 0, 0] },
  { w: 2.05, d: 0.7, h: 0.07, x: 0.55, y: -1.42, z: 1.35, ry: -0.38, rz: -0.03, from: [0.9, 0, 0.3] },
  { w: 0.95, d: 1.1, h: 0.14, x: 2.25, y: -0.6, z: 0.4, ry: 0.95, rz: 0.08, from: [0.8, 0.2, 0] },
  { w: 1.3, d: 0.6, h: 0.06, x: -2.05, y: 0.35, z: -0.35, ry: -0.72, rz: -0.06, from: [-0.8, 0.1, 0] },
  { w: 1.75, d: 1.0, h: 0.1, x: 1.25, y: 1.05, z: -0.65, ry: 0.28, rz: 0.04, from: [0.7, 0.3, -0.2] },
  { w: 1.1, d: 0.8, h: 0.09, x: -0.75, y: -1.85, z: -0.25, ry: -1.12, rz: 0.02, from: [0, -0.6, 0.4] },
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

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
  const metal = new THREE.MeshStandardMaterial({ color: "#a9a397", metalness: 1, roughness: 0.34, roughnessMap: brushed, transparent: true, opacity: 0 });

  // ---------- espinha ----------
  const spine = new THREE.Mesh(new RoundedBoxGeometry(0.07, COL_H + 0.9, 0.07, 2, 0.008), metal);
  spine.position.set(SPINE_X, 0, SPINE_Z);
  root.add(spine);

  // ---------- planta: 7 vagas em contorno + anotação ----------
  const slotGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(SLAB.w, SLAB.h, SLAB.d));
  const slots: { line: THREE.LineSegments; tag: THREE.Sprite; tick: THREE.Line }[] = [];
  STAGES.forEach((name, i) => {
    const y = -COL_H / 2 + i * SLAB.gap;
    const line = new THREE.LineSegments(slotGeo, new THREE.LineBasicMaterial({ color: OSSO, transparent: true, opacity: 0 }));
    line.position.set(0, y, 0);
    root.add(line);
    // marca de cota: da quina frontal direita para fora, e o rótulo na ponta
    const a = new THREE.Vector3(SLAB.w / 2, y, SLAB.d / 2);
    const b = new THREE.Vector3(SLAB.w / 2 + 0.34, y, SLAB.d / 2 + 0.12);
    const tick = new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), new THREE.LineBasicMaterial({ color: OSSO, transparent: true, opacity: 0 }));
    root.add(tick);
    const tag = label(`${String(i + 1).padStart(2, "0")} ${name}`, opts.font, 0, ls);
    tag.position.copy(b).add(new THREE.Vector3(0.05, 0, 0));
    root.add(tag);
    slots.push({ line, tag, tick });
  });

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
    // Planta: contorno e espinha entram de baixo para cima.
    slots.forEach((s, i) => {
      const t = easeOut(clamp01(introT * 1.6 - i * 0.09));
      (s.line.material as THREE.LineBasicMaterial).opacity = 0.34 * t;
      (s.tick.material as THREE.LineBasicMaterial).opacity = 0.22 * t;
      (s.tag.material as THREE.SpriteMaterial).opacity = 0.5 * t * (1 - progress * 0.45);
    });
    metal.opacity = easeOut(clamp01(introT * 1.4));
    metal.transparent = metal.opacity < 1;

    // Soltas: cada peça chega por um eixo só, curta, uma depois da outra.
    pieces.forEach(({ p, mesh, mat, tag }, i) => {
      const t = easeOut(clamp01(progress * 1.7 - i * 0.12));
      const k = 1 - t;
      mesh.position.set(p.x + p.from[0] * k, p.y + p.from[1] * k, p.z + p.from[2] * k);
      mat.opacity = t;
      mat.transparent = t < 1;
      mesh.visible = t > 0.001;
      tag.position.set(mesh.position.x + 0.08, mesh.position.y + p.h / 2 + 0.11, mesh.position.z + p.d / 2);
      (tag.material as THREE.SpriteMaterial).opacity = 0.42 * t;
      tag.visible = mesh.visible;
    });

    // Profundidade: a câmera gira pouco ao redor do objeto conforme a cena muda.
    root.rotation.y = -0.18 + progress * 0.22;
    root.position.y = progress * 0.18;
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
      const next = clamp01(p);
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
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
