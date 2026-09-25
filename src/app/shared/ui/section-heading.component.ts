import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Cabeçalho padrão das seções da home: índice "01 / 04", eyebrow, título display e subtítulo.
 * `tone="inverse"` é usado nas seções com fundo limão.
 */
@Component({
  selector: 'app-section-heading',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './section-heading.component.html',
})
export class SectionHeadingComponent {
  readonly index = input.required<string>();
  readonly total = input('06');
  readonly eyebrow = input.required<string>();
  readonly align = input<'left' | 'center'>('left');
  readonly tone = input<'default' | 'inverse'>('default');
  readonly maxWidth = input('48rem');
}
