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
  template: `
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs text-ink-faint">Novos seguidores · últimos 7 dias</p>
        <p class="display mt-1 text-4xl tabular-nums" aria-live="off">+{{ count() | number }}</p>
      </div>
      <app-badge tone="accent" [dot]="true" [pulse]="true">ao vivo</app-badge>
    </div>

    <svg viewBox="0 0 320 150" class="mt-6 w-full overflow-visible" role="img"
         aria-label="Gráfico ilustrativo: crescimento gradual e contínuo, comparado a um pico artificial repentino">
      <defs>
        <linearGradient id="heroFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="rgb(var(--color-accent))" stop-opacity="0.35" />
          <stop offset="100%" stop-color="rgb(var(--color-accent))" stop-opacity="0" />
        </linearGradient>
        <clipPath id="heroReveal">
          <rect class="reveal" x="0" y="-10" width="330" height="170" />
        </clipPath>
      </defs>

      @for (y of [30, 70, 110]; track y) {
        <line x1="0" x2="320" [attr.y1]="y" [attr.y2]="y" stroke="rgb(var(--color-line))" stroke-dasharray="3 5" />
      }

      <g clip-path="url(#heroReveal)">
        <path [attr.d]="curve + ' L320 150 L0 150Z'" fill="url(#heroFill)" />
        <path d="M0 140 L150 140 L158 40 L320 36" fill="none" stroke="rgb(var(--color-magenta))" stroke-width="2" stroke-dasharray="5 5" />
      </g>
      <path class="draw" [attr.d]="curve" pathLength="1" fill="none" stroke="rgb(var(--color-accent))" stroke-width="3" stroke-linecap="round" />

      <!-- Ponto final: aparece ao fim do desenho e pulsa -->
      <g class="endpoint">
        <circle class="ring" cx="320" cy="20" r="5" fill="none" stroke="rgb(var(--color-accent))" stroke-width="2" />
        <circle cx="320" cy="20" r="5" fill="rgb(var(--color-accent))" stroke="rgb(var(--color-surface))" stroke-width="2" />
      </g>
    </svg>

    <div class="mt-4 flex flex-wrap gap-4 text-xs text-ink-muted">
      <span class="flex items-center gap-2"><span class="h-1 w-5 rounded bg-accent"></span> Crescimento gradual (o nosso)</span>
      <span class="flex items-center gap-2"><span class="h-0.5 w-5 border-t-2 border-dashed border-magenta"></span> Pico repentino (evitamos)</span>
    </div>
    <p class="mt-3 flex items-center gap-1.5 text-[11px] text-ink-faint">
      <app-icon name="info" class="h-3.5 w-3.5" /> Picos repentinos chamam atenção das redes. Crescer aos poucos parece natural.
    </p>
  `,
  styles: `
    .draw {
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      animation: draw 1.8s cubic-bezier(0.65, 0, 0.35, 1) 0.3s forwards;
    }
    .reveal {
      transform-box: fill-box;
      transform-origin: left center;
      transform: scaleX(0);
      animation: reveal 1.8s cubic-bezier(0.65, 0, 0.35, 1) 0.3s forwards;
    }
    .endpoint { opacity: 0; animation: appear 0.3s ease-out 2s forwards; }
    .ring {
      transform-box: fill-box;
      transform-origin: center;
      animation: ring 1.8s ease-out 2.1s infinite;
    }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    @keyframes reveal { to { transform: scaleX(1); } }
    @keyframes appear { to { opacity: 1; } }
    @keyframes ring {
      0% { transform: scale(1); opacity: 0.9; }
      100% { transform: scale(3.2); opacity: 0; }
    }
  `,
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
