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
  template: `
    <div class="flex items-center gap-4" [class.justify-center]="align() === 'center'">
      <span class="font-mono text-[11px] tracking-[0.2em]" [class]="tone() === 'inverse' ? 'text-accent-ink/60' : 'text-ink-faint'">
        {{ index() }} / {{ total() }}
      </span>
      <span class="h-px w-10" [class]="tone() === 'inverse' ? 'bg-accent-ink/30' : 'bg-line'"></span>
      <span class="font-mono text-[11px] font-medium uppercase tracking-[0.22em]"
            [class]="tone() === 'inverse' ? 'text-accent-ink' : 'text-accent'">{{ eyebrow() }}</span>
    </div>
    <h2 class="section-title mt-5" [class.mx-auto]="align() === 'center'" [class.text-center]="align() === 'center'"
        [class]="tone() === 'inverse' ? '!text-accent-ink' : ''" [style.max-width]="maxWidth()">
      <ng-content select="[title]" />
    </h2>
    <div class="mt-4 text-base leading-relaxed sm:text-lg" [class.mx-auto]="align() === 'center'" [class.text-center]="align() === 'center'"
         [class]="tone() === 'inverse' ? 'text-accent-ink/75' : 'text-ink-muted'" [style.max-width]="'40rem'">
      <ng-content select="[subtitle]" />
    </div>
  `,
})
export class SectionHeadingComponent {
  readonly index = input.required<string>();
  readonly total = input('04');
  readonly eyebrow = input.required<string>();
  readonly align = input<'left' | 'center'>('left');
  readonly tone = input<'default' | 'inverse'>('default');
  readonly maxWidth = input('48rem');
}
