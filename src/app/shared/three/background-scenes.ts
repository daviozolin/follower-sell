import type * as THREE_NS from 'three';

type Three = typeof THREE_NS;

export interface SceneOptions {
  /** Duas cores da cena (hex). */
  colors: [string, string];
  /** Multiplicador de opacidade final (0–1). */
  opacity: number;
  /** Multiplicador de densidade de partículas (onda). */
  density: number;
  /** Multiplicador de velocidade. */
  speed: number;
}

export interface BackgroundScene {
  scene: THREE_NS.Scene;
  camera: THREE_NS.Camera;
  update(time: number, pointer: { x: number; y: number }): void;
  resize(width: number, height: number, pixelRatio: number): void;
  dispose(): void;
}

// -----------------------------------------------------------------------------
// Onda de partículas: um "terreno" de pontos que ondula devagar (hero / dúvidas)
// -----------------------------------------------------------------------------

const WAVE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec2 uPointer;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  attribute float aRandom;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float w = sin(p.x * 0.32 + uTime * 0.55) * 0.55
            + sin(p.z * 0.45 + uTime * 0.38) * 0.35
            + sin((p.x + p.z) * 0.18 + uTime * 0.27) * 0.6;
    // leve reação ao ponteiro (parallax)
    w += uPointer.x * 0.35 * sin(p.z * 0.25 + uTime * 0.2);
    p.y += w;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (1.6 + aRandom * 1.8) * uPixelRatio * (22.0 / -mv.z);

    float crest = smoothstep(-1.1, 1.3, w);
    vColor = mix(uColorA, uColorB, crest);
    // some ao longe e realça as cristas
    vAlpha = smoothstep(58.0, 10.0, -mv.z) * (0.25 + 0.75 * crest);
  }
`;

const WAVE_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = smoothstep(0.5, 0.15, d);
    gl_FragColor = vec4(vColor, disc * vAlpha * uOpacity);
  }
`;

export function createWaveScene(THREE: Three, opts: SceneOptions): BackgroundScene {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 5.5, 18);
  camera.lookAt(0, 0, -6);

  const cols = Math.round(150 * opts.density);
  const rows = Math.round(70 * opts.density);
  const spacing = 0.55 / opts.density;
  const count = cols * rows;
  const positions = new Float32Array(count * 3);
  const randoms = new Float32Array(count);
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const k = i * rows + j;
      positions[k * 3] = (i - cols / 2) * spacing;
      positions[k * 3 + 1] = 0;
      positions[k * 3 + 2] = -j * spacing + 8;
      randoms[k] = Math.random();
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: WAVE_VERTEX,
    fragmentShader: WAVE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uPointer: { value: new THREE.Vector2() },
      uOpacity: { value: opts.opacity },
      uColorA: { value: new THREE.Color(opts.colors[0]) },
      uColorB: { value: new THREE.Color(opts.colors[1]) },
    },
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  return {
    scene,
    camera,
    update(time, pointer) {
      material.uniforms['uTime'].value = time * opts.speed;
      (material.uniforms['uPointer'].value as THREE_NS.Vector2).set(pointer.x, pointer.y);
      camera.position.x = pointer.x * 0.8;
      camera.position.y = 5.5 + pointer.y * 0.4;
      camera.lookAt(0, 0, -6);
    },
    resize(width, height, pixelRatio) {
      camera.aspect = width / Math.max(1, height);
      camera.updateProjectionMatrix();
      material.uniforms['uPixelRatio'].value = pixelRatio;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

// -----------------------------------------------------------------------------
// Aurora: faixas de cor em ruído fractal que fluem devagar (combos / segurança)
// -----------------------------------------------------------------------------

const AURORA_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const AURORA_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uAspect;
  uniform float uOpacity;
  uniform vec2 uPointer;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    uv.x *= uAspect;
    uv += uPointer * 0.04;
    float t = uTime * 0.05;
    vec2 q = vec2(fbm(uv * 1.6 + vec2(t, -t)), fbm(uv * 1.6 + vec2(-t * 0.7, t * 1.3) + 4.2));
    float n = fbm(uv * 1.4 + q * 1.8 + vec2(t * 0.6, 0.0));
    // faixas diagonais suaves
    float band = smoothstep(0.35, 0.75, n) * (0.55 + 0.45 * sin(uv.x * 1.2 + uv.y * 2.4 + uTime * 0.12));
    vec3 color = mix(uColorA, uColorB, smoothstep(0.3, 0.8, q.x));
    gl_FragColor = vec4(color, band * uOpacity);
  }
`;

export function createAuroraScene(THREE: Three, opts: SceneOptions): BackgroundScene {
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const geometry = new THREE.PlaneGeometry(2, 2);
  const material = new THREE.ShaderMaterial({
    vertexShader: AURORA_VERTEX,
    fragmentShader: AURORA_FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uOpacity: { value: opts.opacity },
      uPointer: { value: new THREE.Vector2() },
      uColorA: { value: new THREE.Color(opts.colors[0]) },
      uColorB: { value: new THREE.Color(opts.colors[1]) },
    },
  });
  scene.add(new THREE.Mesh(geometry, material));

  return {
    scene,
    camera,
    update(time, pointer) {
      material.uniforms['uTime'].value = time * opts.speed;
      (material.uniforms['uPointer'].value as THREE_NS.Vector2).set(pointer.x, pointer.y);
    },
    resize(width, height) {
      material.uniforms['uAspect'].value = width / Math.max(1, height);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
