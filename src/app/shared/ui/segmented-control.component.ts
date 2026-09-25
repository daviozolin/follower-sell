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
  templateUrl: './segmented-control.component.html',
})
export class SegmentedControlComponent<T extends string> {
  readonly options = input.required<SegmentOption<T>[]>();
  readonly value = model.required<T>();
  readonly ariaLabel = input('');

  protected indexOf(v: T): number {
    return Math.max(0, this.options().findIndex((o) => o.value === v));
  }
}
