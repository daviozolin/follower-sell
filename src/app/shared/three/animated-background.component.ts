import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { BackgroundScene, SceneOptions } from './background-scenes';
import type { ReactionKind } from './pop-scene';

export type BackgroundVariant = 'wave' | 'aurora' | 'pop';

const MAX_PIXEL_RATIO = 1.5;

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Fundo animado em WebGL (Three.js), puramente decorativo.
 *
 * Desempenho e acessibilidade:
 *  - Three.js é carregado sob demanda (`import()`), fora do bundle inicial;
 *  - o loop roda fora da zona do Angular (sem change detection por frame);
 *  - pausa quando a seção sai da tela ou a aba fica oculta;
 *  - `prefers-reduced-motion`: renderiza um único quadro estático;
 *  - sem WebGL: nada é renderizado (os fundos em CSS continuam valendo);
 *  - `interactive`: o host continua com `pointer-events: none` (não bloqueia cliques no conteúdo);
 *    os eventos são lidos na janela e convertidos para coordenadas da seção.
 */
@Component({
  selector: 'app-animated-bg',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pointer-events-none absolute inset-0 overflow-hidden', 'aria-hidden': 'true' },
  templateUrl: './animated-background.component.html',
})
export class AnimatedBackgroundComponent {
  readonly variant = input<BackgroundVariant>('wave');
  readonly colors = input<[string, string]>(['#C6FF3D', '#FF2E93']);
  readonly opacity = input(1);
  readonly density = input(1);
  readonly speed = input(1);
  /** Reage ao cursor sobre a seção (colina) e a cliques/toques (ondulação). */
  readonly interactive = input(false);
  /** Variante `pop`: emitido quando uma reação estoura (seguidor, curtida ou visualização). */
  readonly reaction = output<ReactionKind>();

  protected readonly ready = signal(false);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private destroyed = false;

  constructor() {
    this.destroyRef.onDestroy(() => (this.destroyed = true));
    afterNextRender(() => this.zone.runOutsideAngular(() => void this.init()));
  }

  private async init(): Promise<void> {
    if (!webglAvailable()) return;
    const [THREE, scenes, pop] = await Promise.all([import('three'), import('./background-scenes'), import('./pop-scene')]);
    if (this.destroyed) return;

    const canvas = this.canvas().nativeElement;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);

    const options: SceneOptions = {
      colors: this.colors(),
      opacity: this.opacity(),
      density: this.density(),
      speed: this.speed(),
    };
    const variant = this.variant();
    const bg: BackgroundScene =
      variant === 'aurora'
        ? scenes.createAuroraScene(THREE, options)
        : variant === 'pop'
          ? pop.createPopScene(THREE, {
              ...options,
              // o loop roda fora da zona; volta para ela só para emitir o evento
              onReaction: (kind) => this.zone.run(() => this.reaction.emit(kind)),
            })
          : scenes.createWaveScene(THREE, options);

    // --- tamanho -------------------------------------------------------------
    const hostEl = this.host.nativeElement as HTMLElement;
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = hostEl;
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      renderer.setPixelRatio(ratio);
      renderer.setSize(w, h, false);
      bg.resize(w, h, ratio);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(hostEl);

    // --- ponteiro (parallax suave, interpolado) -------------------------------
    const pointer = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const interactive = this.interactive() && !reducedMotion.matches;

    /** Ponteiro em NDC relativo à seção, ou `null` se estiver fora dela. */
    const localNdc = (e: PointerEvent) => {
      const rect = hostEl.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      return x < 0 || x > 1 || y < 0 || y > 1 ? null : { x: x * 2 - 1, y: -(y * 2 - 1) };
    };
    const onPointer = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = -((e.clientY / window.innerHeight) * 2 - 1);
      // toque não tem "hover": só o clique/toque gera interação
      if (interactive && e.pointerType === 'mouse') bg.hover?.(localNdc(e));
    };
    const onPointerDown = (e: PointerEvent) => {
      const ndc = interactive && localNdc(e);
      if (ndc) bg.pulse?.(ndc);
    };
    const onLeave = () => bg.hover?.(null);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    // --- loop ------------------------------------------------------------------
    const clock = new THREE.Clock();
    let elapsed = 12; // começa "no meio" da animação, já com formas interessantes
    const frame = () => {
      elapsed += Math.min(clock.getDelta(), 0.05);
      pointer.x += (target.x - pointer.x) * 0.04;
      pointer.y += (target.y - pointer.y) * 0.04;
      bg.update(elapsed, pointer);
      renderer.render(bg.scene, bg.camera);
    };

    let visible = false;
    const sync = () => {
      const run = visible && !document.hidden && !reducedMotion.matches;
      if (run) clock.getDelta(); // descarta o tempo parado
      renderer.setAnimationLoop(run ? frame : null);
      if (!run && reducedMotion.matches) frame(); // quadro estático
    };
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    intersection.observe(hostEl);
    document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', sync);

    frame();
    this.zone.run(() => this.ready.set(true));

    this.destroyRef.onDestroy(() => {
      renderer.setAnimationLoop(null);
      intersection.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onPointerDown);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', sync);
      reducedMotion.removeEventListener('change', sync);
      bg.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    });
  }
}
