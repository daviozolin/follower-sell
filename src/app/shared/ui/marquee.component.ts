import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Faixa de texto em loop — separador visual entre o hero e o catálogo. */
@Component({
  selector: 'app-marquee',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block overflow-hidden', 'aria-hidden': 'true' },
  templateUrl: './marquee.component.html',
})
export class MarqueeComponent {
  readonly items = input.required<string[]>();
}
