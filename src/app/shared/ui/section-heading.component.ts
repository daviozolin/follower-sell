import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const TONES = {
  default: { index: 'text-ink-faint', rule: 'bg-line', eyebrow: 'text-accent', title: '', subtitle: 'text-ink-muted' },
  inverse: { index: 'text-accent-ink/60', rule: 'bg-accent-ink/30', eyebrow: 'text-accent-ink', title: '!text-accent-ink', subtitle: 'text-accent-ink/75' },
  paper: { index: 'text-canvas/50', rule: 'bg-canvas/20', eyebrow: 'text-magenta', title: '!text-canvas', subtitle: 'text-canvas/70' },
} as const;

/**
 * Cabeçalho padrão das seções da home: índice "01 / 04", eyebrow, título display e subtítulo.
 * `tone="inverse"`: seções com fundo limão · `tone="paper"`: seções com fundo claro.
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
  /** `inverse` = sobre limão · `paper` = sobre fundo claro (papel). */
  readonly tone = input<'default' | 'inverse' | 'paper'>('default');

  protected readonly cls = computed(() => TONES[this.tone()]);
  readonly maxWidth = input('48rem');
}
