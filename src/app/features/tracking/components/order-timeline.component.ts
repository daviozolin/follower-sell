import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Order, OrderStatus, SERVICE_LABEL, ServiceType } from '../../../core/models';
import { IconComponent, IconName } from '../../../shared/ui/icon.component';

type StepState = 'done' | 'current' | 'upcoming';

interface TimelineStep {
  label: string;
  icon: IconName;
  at: string | null;
  state: StepState;
  hint: string;
}

/** Quantas etapas estão concluídas para cada status. */
const COMPLETED_STEPS: Record<OrderStatus, number> = {
  pending: 1,
  processing: 2,
  delivering: 2,
  completed: 4,
  refilling: 4,
};

@Component({
  selector: 'app-order-timeline',
  standalone: true,
  imports: [DatePipe, DecimalPipe, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-timeline.component.html',
})
export class OrderTimelineComponent {
  readonly order = input.required<Order>();

  protected readonly serviceLabel = SERVICE_LABEL;
  /** Mesmas cores validadas do cronograma do combo. */
  protected readonly seriesColor: Record<ServiceType, string> = { followers: '#78A416', likes: '#FF2E93', views: '#1C9FD0' };

  protected pct(delivered: number, amount: number): number {
    return Math.floor((delivered / Math.max(1, amount)) * 100);
  }

  protected readonly percent = computed(() => Math.floor((this.order().delivered / this.order().amount) * 100));

  protected readonly steps = computed<TimelineStep[]>(() => {
    const o = this.order();
    const completed = COMPLETED_STEPS[o.status];
    const raw: Omit<TimelineStep, 'state'>[] = [
      { label: 'Pedido recebido', icon: 'package', at: o.createdAt, hint: '' },
      { label: 'Pagamento aprovado', icon: 'card', at: o.paidAt, hint: 'Aguardando confirmação' },
      { label: 'Processando entrega', icon: 'zap', at: o.deliveryStartedAt, hint: o.status === 'processing' ? 'Preparando lotes…' : 'Em breve' },
      { label: 'Concluído', icon: 'check-circle', at: o.completedAt, hint: 'Previsto após a entrega' },
    ];
    return raw.map((s, i) => ({
      ...s,
      state: i < completed ? 'done' : i === completed ? 'current' : 'upcoming',
    }));
  });
}
