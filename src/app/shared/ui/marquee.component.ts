import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Faixa de texto em loop — separador visual entre o hero e o catálogo. */
@Component({
  selector: 'app-marquee',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block overflow-hidden', 'aria-hidden': 'true' },
  template: `
    <div class="flex w-max animate-marquee motion-reduce:animate-none">
      @for (copy of [0, 1]; track copy) {
        <div class="flex shrink-0 items-center">
          @for (item of items(); track item) {
            <span class="px-6 font-display text-2xl font-extrabold uppercase tracking-[-0.02em] sm:text-3xl">{{ item }}</span>
            <span class="text-xl">✦</span>
          }
        </div>
      }
    </div>
  `,
})
export class MarqueeComponent {
  readonly items = input.required<string[]>();
}
