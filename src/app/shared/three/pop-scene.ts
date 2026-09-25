import type * as THREE_NS from 'three';
import type { BackgroundScene, SceneOptions } from './background-scenes';

type Three = typeof THREE_NS;

/** Tipo de reação — também é o índice da célula no atlas de texturas. */
export type ReactionKind = 'follow' | 'like' | 'view';
const KINDS: ReactionKind[] = ['follow', 'like', 'view'];
const SPARK = 3;
const MAX = 220;

/** Proporção típica de engajamento: muitas views, várias curtidas, alguns seguidores. */
const MIX: Array<[ReactionKind, number]> = [
  ['view', 0.42],
  ['like', 0.4],
  ['follow', 0.18],
];

// --- Atlas de ícones desenhado em canvas (sem imagens externas) ---------------

const CELL = 128;
const ICONS: Record<ReactionKind, { bg: string; fg: string; fill: boolean; paths: string[] }> = {
  follow: {
    bg: '#C6FF3D',
    fg: '#0C0E04',
    fill: false,
    paths: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', 'M19 8v6', 'M22 11h-6'],
  },
  like: {
    bg: '#FF2E93',
    fg: '#FFFFFF',
    fill: true,
    paths: ['M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z'],
  },
  view: {
    bg: '#1C9FD0',
    fg: '#FFFFFF',
    fill: false,
    paths: ['M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0', 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  },
};

function buildAtlas(THREE: Three): THREE_NS.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = CELL * 4;
  canvas.height = CELL;
  const ctx = canvas.getContext('2d')!;

  KINDS.forEach((kind, i) => {
    const icon = ICONS[kind];
    const cx = i * CELL + CELL / 2;
    const cy = CELL / 2;
    ctx.save();
    ctx.shadowColor = icon.bg;
    ctx.shadowBlur = 16;
    ctx.fillStyle = icon.bg;
    ctx.beginPath();
    ctx.arc(cx, cy, CELL * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    const scale = 2.3;
    ctx.translate(cx - 12 * scale, cy - 12 * scale + (kind === 'like' ? 1.5 : 0));
    ctx.scale(scale, scale);
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = icon.fg;
    ctx.fillStyle = icon.fg;
    for (const d of icon.paths) {
      const path = new Path2D(d);
      if (icon.fill) ctx.fill(path);
      ctx.stroke(path);
    }
    ctx.restore();
  });

  // célula 4: faísca (ponto macio)
  const g = ctx.createRadialGradient(CELL * 3.5, CELL / 2, 0, CELL * 3.5, CELL / 2, CELL / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(CELL * 3, 0, CELL, CELL);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// --- Shaders -------------------------------------------------------------------

const VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute float aCell;
  uniform float uPixelRatio;
  uniform vec2 uResolution;
  varying float vAlpha;
  varying float vCell;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio;
    // mais discreto atrás do texto (coluna esquerda do hero)
    float x = position.x / max(1.0, uResolution.x);
    vAlpha = aAlpha * mix(0.4, 1.0, smoothstep(0.25, 0.6, x));
    vCell = aCell;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vCell;

  void main() {
    vec2 uv = vec2((vCell + gl_PointCoord.x) / 4.0, 1.0 - gl_PointCoord.y);
    vec4 tex = texture2D(uAtlas, uv);
    gl_FragColor = vec4(tex.rgb, tex.a * vAlpha * uOpacity);
  }
`;

// --- Simulação -----------------------------------------------------------------

interface Particle {
  alive: boolean;
  cell: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  depth: number;
  age: number;
  life: number;
  phase: number;
  /** >0 = estourando (tempo desde o estouro). */
  popAge: number;
}

const easeOutBack = (t: number) => {
  const c1 = 1.9;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export interface PopSceneOptions extends SceneOptions {
  /** Chamado quando uma reação "estoura" — usado para somar nos contadores do hero. */
  onReaction?: (kind: ReactionKind) => void;
}

/**
 * Reações (seguidores, curtidas, visualizações) que surgem, sobem devagar e "pipocam",
 * simulando uma conta crescendo em tempo real. Câmera ortográfica em pixels CSS.
 */
export function createPopScene(THREE: Three, opts: PopSceneOptions): BackgroundScene {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 0, 1, -10, 10);
  let width = 1;
  let height = 1;

  const particles: Particle[] = Array.from({ length: MAX }, () => ({
    alive: false, cell: 0, x: 0, y: 0, vx: 0, vy: 0, size: 0, depth: 1, age: 0, life: 1, phase: 0, popAge: 0,
  }));

  const positions = new Float32Array(MAX * 3);
  const sizes = new Float32Array(MAX);
  const alphas = new Float32Array(MAX);
  const cells = new Float32Array(MAX);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute('aCell', new THREE.BufferAttribute(cells, 1).setUsage(THREE.DynamicDrawUsage));

  const atlas = buildAtlas(THREE);
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uAtlas: { value: atlas },
      uOpacity: { value: opts.opacity },
      uPixelRatio: { value: 1 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    },
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  const pickKind = (): number => {
    let r = Math.random();
    for (const [kind, w] of MIX) {
      if ((r -= w) <= 0) return KINDS.indexOf(kind);
    }
    return 1;
  };

  const spawn = (x: number, y: number, init: Partial<Particle> = {}): Particle | null => {
    const p = particles.find((q) => !q.alive);
    if (!p) return null;
    const depth = 0.55 + Math.random() * 0.45;
    Object.assign(p, {
      alive: true,
      cell: pickKind(),
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: -(14 + Math.random() * 20) * depth,
      size: (30 + Math.random() * 22) * depth,
      depth,
      age: 0,
      life: 6 + Math.random() * 5,
      phase: Math.random() * Math.PI * 2,
      popAge: 0,
      ...init,
    });
    return p;
  };

  /** Faíscas radiais quando uma reação estoura. */
  const sparks = (x: number, y: number, count: number) => {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 40 + Math.random() * 50;
      spawn(x, y, {
        cell: SPARK,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        size: 7 + Math.random() * 5,
        depth: 1,
        life: 0.55 + Math.random() * 0.3,
      });
    }
  };

  /** Rajada de reações num ponto ("momento viral" ou clique). */
  const burst = (x: number, y: number, count: number, spread = 60) => {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * spread;
      spawn(x + Math.cos(a) * r, y + Math.sin(a) * r, {
        vx: Math.cos(a) * (8 + Math.random() * 18),
        vy: -(22 + Math.random() * 26),
        age: -Math.random() * 0.35, // entradas escalonadas
        life: 3.5 + Math.random() * 3,
      });
    }
  };

  let lastTime = 0;
  let spawnAcc = 0;
  let nextViral = 3;
  let clock = 0;
  const hoverPx = { x: 0, y: 0, active: false, trailAcc: 0 };

  const step = (dt: number) => {
    clock += dt;
    // fluxo contínuo, concentrado na metade direita (o texto fica à esquerda)
    spawnAcc += dt * 2.6;
    while (spawnAcc >= 1) {
      spawnAcc -= 1;
      const x = width * (Math.random() < 0.72 ? 0.45 + Math.random() * 0.55 : Math.random() * 0.45);
      spawn(x, height * (0.55 + Math.random() * 0.5));
    }
    if (clock >= nextViral) {
      nextViral = clock + 5 + Math.random() * 4;
      burst(width * (0.55 + Math.random() * 0.4), height * (0.45 + Math.random() * 0.4), 8 + Math.floor(Math.random() * 6));
    }
    if (hoverPx.active) {
      hoverPx.trailAcc += dt;
      if (hoverPx.trailAcc > 0.28) {
        hoverPx.trailAcc = 0;
        spawn(hoverPx.x + (Math.random() - 0.5) * 30, hoverPx.y + (Math.random() - 0.5) * 20, { life: 2.5 + Math.random() * 1.5 });
      }
    }

    for (const p of particles) {
      if (!p.alive) continue;
      p.age += dt;
      if (p.age < 0) continue;
      if (p.cell === SPARK) {
        p.vx *= 0.9;
        p.vy *= 0.9;
      } else {
        p.vx += Math.sin(clock * 1.3 + p.phase) * 4 * dt; // balanço lateral
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.popAge > 0) {
        p.popAge += dt;
        if (p.popAge > 0.28) p.alive = false;
      } else if (p.age >= p.life) {
        if (p.cell === SPARK) p.alive = false;
        else {
          p.popAge = 1e-6;
          sparks(p.x, p.y, 6);
          opts.onReaction?.(KINDS[p.cell]);
        }
      }
      if (p.y < -60) p.alive = false;
    }
  };

  const write = () => {
    for (let i = 0; i < MAX; i++) {
      const p = particles[i];
      if (!p.alive || p.age < 0) {
        alphas[i] = 0;
        sizes[i] = 0;
        continue;
      }
      let scale: number;
      let alpha: number;
      if (p.cell === SPARK) {
        const t = p.age / p.life;
        scale = 1 - t * 0.6;
        alpha = (1 - t) * 0.9;
      } else if (p.popAge > 0) {
        const t = p.popAge / 0.28;
        scale = 1 + t * 0.6;
        alpha = (1 - t) * p.depth;
      } else {
        scale = easeOutBack(Math.min(1, p.age / 0.45));
        alpha = Math.min(1, p.age / 0.3) * p.depth;
      }
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.depth;
      sizes[i] = p.size * Math.max(0, scale);
      alphas[i] = alpha;
      cells[i] = p.cell;
    }
    geometry.attributes['position'].needsUpdate = true;
    geometry.attributes['aSize'].needsUpdate = true;
    geometry.attributes['aAlpha'].needsUpdate = true;
    geometry.attributes['aCell'].needsUpdate = true;
  };

  let prewarmed = false;
  const toPx = (ndc: { x: number; y: number }) => ({ x: ((ndc.x + 1) / 2) * width, y: ((1 - ndc.y) / 2) * height });

  return {
    scene,
    camera,
    update(time, pointer) {
      if (!prewarmed) {
        // já começa com a tela "viva" (e dá um quadro bonito no modo sem movimento)
        prewarmed = true;
        const onReaction = opts.onReaction;
        opts.onReaction = undefined;
        for (let i = 0; i < 240; i++) step(1 / 30);
        opts.onReaction = onReaction;
        lastTime = time;
      }
      const dt = Math.min(0.05, Math.max(0, time - lastTime)) * opts.speed;
      lastTime = time;
      step(dt);
      write();
      points.position.set(pointer.x * -8, pointer.y * 5, 0); // parallax sutil
    },
    resize(w, h, pixelRatio) {
      width = w;
      height = h;
      camera.left = 0;
      camera.right = w;
      camera.top = 0;
      camera.bottom = h;
      camera.updateProjectionMatrix();
      material.uniforms['uPixelRatio'].value = pixelRatio;
      (material.uniforms['uResolution'].value as THREE_NS.Vector2).set(w, h);
    },
    hover(ndc) {
      if (!ndc) {
        hoverPx.active = false;
        return;
      }
      Object.assign(hoverPx, toPx(ndc), { active: true });
    },
    pulse(ndc) {
      const { x, y } = toPx(ndc);
      sparks(x, y, 10);
      burst(x, y, 10, 24);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      atlas.dispose();
    },
  };
}
