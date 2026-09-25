import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { IconComponent } from '../../../shared/ui/icon.component';

const TARGET = 2480;
const COUNT_MS = 1800;
const CURVE = 'M0 135 C40 128 70 118 105 104 S170 76 210 60 S280 30 320 20';

/**
 * Gráfico ilustrativo do hero, animado:
 *  1. a curva de crescimento gradual se desenha da esquerda para a direita;
 *  2. área e "pico artificial" são revelados em sincronia;
 *  3. o contador sobe até o total e depois segue "ao vivo" com pequenos incrementos.
 * Com `prefers-reduced-motion`, tudo aparece pronto e estático (regra global em styles.scss + checagem abaixo).
 */
@Component({
  selector: 'app-hero-growth-chart',
  standalone: true,
  imports: [DecimalPipe, BadgeComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero-growth-chart.component.html',
  styleUrl: './hero-growth-chart.component.scss',
})
export class HeroGrowthChartComponent {
  protected readonly curve = CURVE;
  protected readonly count = signal(0);

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Só no browser, depois da primeira renderização.
    afterNextRender(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let raf = 0;
      let live: ReturnType<typeof setInterval> | undefined;

      const startLive = () => {
        live = setInterval(() => this.count.update((c) => c + 1 + Math.floor(Math.random() * 3)), 2600);
      };

      if (reduced) {
        this.count.set(TARGET); // sem contagem nem incrementos "ao vivo"
      } else {
        const start = performance.now() + 300; // acompanha o atraso do desenho
        const tick = (now: number) => {
          const t = Math.min(1, Math.max(0, (now - start) / COUNT_MS));
          const eased = 1 - Math.pow(1 - t, 3);
          this.count.set(Math.round(TARGET * eased));
          if (t < 1) raf = requestAnimationFrame(tick);
          else startLive();
        };
        raf = requestAnimationFrame(tick);
      }

      destroyRef.onDestroy(() => {
        cancelAnimationFrame(raf);
        clearInterval(live);
      });
    });
  }
}
