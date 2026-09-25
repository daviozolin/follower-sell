import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from './icon.component';

let nextId = 0;

/** Tooltip acessível (hover + foco por teclado), puramente CSS. */
@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'group/tip relative inline-flex' },
  templateUrl: './tooltip.component.html',
})
export class TooltipComponent {
  readonly text = input.required<string>();
  readonly label = input('Mais informações');
  protected readonly id = `tip-${++nextId}`;
}
