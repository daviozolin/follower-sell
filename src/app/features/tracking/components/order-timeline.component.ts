import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Order, OrderStatus } from '../../../core/models';
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
  template: `
    <ol class="relative grid gap-6 md:grid-cols-4 md:gap-3">
      @for (step of steps(); track step.label; let last = $last) {
        <li class="relative flex gap-4 md:flex-col md:items-center md:text-center">
          <!-- conector -->
          @if (!last) {
            <span aria-hidden="true"
                  class="absolute left-[19px] top-11 h-[calc(100%-1.25rem)] w-0.5 md:left-[calc(50%+1.75rem)] md:top-5 md:h-0.5 md:w-[calc(100%-3.5rem+0.75rem)]"
                  [class]="step.state === 'done' ? 'bg-success/70' : 'bg-line'"></span>
          }
          <span class="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500"
                [class]="step.state === 'done' ? 'border-success bg-success text-canvas'
                       : step.state === 'current' ? 'border-accent bg-accent/15 text-accent-soft shadow-glow'
                       : 'border-line bg-surface text-ink-faint'">
            @if (step.state === 'current') {
              <span class="absolute inset-0 animate-pulse-ring rounded-full border-2 border-accent"></span>
            }
            <app-icon [name]="step.state === 'done' ? 'check' : step.icon" class="h-4 w-4" [stroke]="step.state === 'done' ? 3 : 1.8" />
          </span>
          <div class="pb-1 md:mt-3">
            <p class="font-medium" [class.text-ink-faint]="step.state === 'upcoming'">{{ step.label }}</p>
            <p class="mt-0.5 text-xs text-ink-muted">
              @if (step.at) { {{ step.at | date: "dd/MM 'às' HH:mm" }} } @else { {{ step.hint }} }
            </p>
          </div>
        </li>
      }
    </ol>

    @if (order().status === 'delivering' || order().status === 'processing') {
      <div class="mt-8 rounded-xl border border-line bg-canvas/40 p-4">
        <div class="flex justify-between text-sm">
          <span class="text-ink-muted">Progresso da entrega</span>
          <span class="font-mono tabular-nums">{{ order().delivered | number }} / {{ order().amount | number }}</span>
        </div>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-line" role="progressbar" [attr.aria-valuenow]="percent()" aria-valuemin="0" aria-valuemax="100">
          <div class="relative h-full rounded-full bg-gradient-to-r from-magenta to-accent transition-[width] duration-700 ease-out" [style.width.%]="percent()">
            <span class="absolute inset-0 animate-pulse bg-white/20"></span>
          </div>
        </div>
        <p class="mt-2 text-right text-xs text-ink-faint">{{ percent() }}%</p>
      </div>
    }
  `,
})
export class OrderTimelineComponent {
  readonly order = input.required<Order>();

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
