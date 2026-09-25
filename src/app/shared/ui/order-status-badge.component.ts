import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ORDER_STATUS_LABEL, OrderStatus } from '../../core/models';
import { BadgeComponent, BadgeTone } from './badge.component';

const TONE: Record<OrderStatus, BadgeTone> = {
  pending: 'warning',
  processing: 'accent',
  delivering: 'accent',
  completed: 'success',
  refilling: 'warning',
};

@Component({
  selector: 'app-order-status-badge',
  standalone: true,
  imports: [BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-status-badge.component.html',
})
export class OrderStatusBadgeComponent {
  readonly status = input.required<OrderStatus>();
  protected readonly tone = computed(() => TONE[this.status()]);
  protected readonly label = computed(() => ORDER_STATUS_LABEL[this.status()]);
  protected readonly live = computed(() => this.status() !== 'completed');
}
