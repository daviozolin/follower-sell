import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { IconComponent, IconName } from './icon.component';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
  hint?: string;
}

/** Toggle segmentado com indicador deslizante. Suporta `[(value)]`. */
@Component({
  selector: 'app-segmented-control',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div role="radiogroup" [attr.aria-label]="ariaLabel()"
         class="relative grid rounded-xl border border-line bg-canvas/60 p-1"
         [style.grid-template-columns]="'repeat(' + options().length + ', minmax(0, 1fr))'">
      <span aria-hidden="true"
            class="absolute inset-y-1 left-1 rounded-lg bg-surface-raised shadow-glow transition-transform duration-300 ease-out"
            [style.width]="'calc((100% - 0.5rem) / ' + options().length + ')'"
            [style.transform]="'translateX(' + indexOf(value()) * 100 + '%)'"></span>
      @for (opt of options(); track opt.value) {
        <button type="button" role="radio" [attr.aria-checked]="opt.value === value()" (click)="value.set(opt.value)"
                class="relative z-10 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                [class.text-ink]="opt.value === value()" [class.text-ink-muted]="opt.value !== value()">
          @if (opt.icon) { <app-icon [name]="opt.icon" class="h-4 w-4" /> }
          <span>{{ opt.label }}</span>
          @if (opt.hint) { <span class="hidden text-[11px] font-normal text-ink-faint sm:inline">{{ opt.hint }}</span> }
        </button>
      }
    </div>
  `,
})
export class SegmentedControlComponent<T extends string> {
  readonly options = input.required<SegmentOption<T>[]>();
  readonly value = model.required<T>();
  readonly ariaLabel = input('');

  protected indexOf(v: T): number {
    return Math.max(0, this.options().findIndex((o) => o.value === v));
  }
}
