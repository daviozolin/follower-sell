import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
import { PopOnChangeDirective } from '../../../shared/directives/pop-on-change.directive';
import type { ReactionKind } from '../../../shared/three/pop-scene';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { IconComponent } from '../../../shared/ui/icon.component';

const TARGET = 2480;
const COUNT_MS = 1800;
const CURVE = 'M0 135 C40 128 70 118 105 104 S170 76 210 60 S280 30 320 20';

/**
 * Gráfico ilustrativo do hero, animado:
 *  1. a curva de crescimento gradual se desenha da esquerda para a direita;
 *  2. área e "pico artificial" são revelados em sincronia;
 *  3. o contador sobe até o total; depois, seguidores/curtidas/visualizações avançam a cada
 *     reação que "pipoca" no fundo do hero (ver `bump`).
 * Com `prefers-reduced-motion`, tudo aparece pronto e estático (regra global em styles.scss + checagem abaixo).
 */
@Component({
  selector: 'app-hero-growth-chart',
  standalone: true,
  imports: [DecimalPipe, BadgeComponent, IconComponent, PopOnChangeDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-growth-chart.component.html',
  styleUrl: './hero-growth-chart.component.scss',
})
export class HeroGrowthChartComponent {
  protected readonly curve = CURVE;
  protected readonly count = signal(0);
  protected readonly likes = signal(18_940);
  protected readonly views = signal(96_300);

  /** Contadores "ao vivo" exibidos em chips (o pulo a cada incremento vem de `appPopOnChange`). */
  protected readonly live = computed(() => [
    { kind: 'follow' as const, icon: 'users' as const, label: 'seguidores', value: this.count(), tone: 'text-accent' },
    { kind: 'like' as const, icon: 'heart' as const, label: 'curtidas', value: this.likes(), tone: 'text-magenta' },
    { kind: 'view' as const, icon: 'eye' as const, label: 'visualizações', value: this.views(), tone: 'text-[#4FC3EE]' },
  ]);

  private counting = true;
  private lastBump = 0;

  /**
   * Soma uma reação vinda do fundo animado (cada ícone que "pipoca").
   * Durante a contagem inicial, só curtidas e visualizações avançam.
   */
  bump(kind: ReactionKind): void {
    this.lastBump = performance.now();
    if (kind === 'like') this.likes.update((v) => v + 1 + Math.floor(Math.random() * 3));
    else if (kind === 'view') this.views.update((v) => v + 5 + Math.floor(Math.random() * 20));
    else if (!this.counting) this.count.update((v) => v + 1 + Math.floor(Math.random() * 2));
  }

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Só no browser, depois da primeira renderização.
    afterNextRender(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let raf = 0;
      let fallback: ReturnType<typeof setInterval> | undefined;

      // Sem fundo animado (ex.: sem WebGL), mantém os números vivos devagar.
      const startFallback = () => {
        fallback = setInterval(() => {
          if (performance.now() - this.lastBump > 4000) this.bump((['follow', 'like', 'view'] as const)[Math.floor(Math.random() * 3)]);
        }, 2600);
      };

      if (reduced) {
        this.count.set(TARGET); // sem contagem nem incrementos "ao vivo"
        this.counting = false;
      } else {
        const start = performance.now() + 300; // acompanha o atraso do desenho
        const tick = (now: number) => {
          const t = Math.min(1, Math.max(0, (now - start) / COUNT_MS));
          const eased = 1 - Math.pow(1 - t, 3);
          this.count.set(Math.round(TARGET * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
          else {
            this.counting = false;
            startFallback();
          }
        };
        raf = requestAnimationFrame(tick);
      }

      destroyRef.onDestroy(() => {
        cancelAnimationFrame(raf);
        clearInterval(fallback);
      });
    });
  }
}
