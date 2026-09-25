import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/ui/icon.component';
import { CheckoutStore } from '../checkout.store';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store.order(); as order) {
      <div class="animate-fade-up py-4 text-center">
        <div class="relative mx-auto flex h-16 w-16 items-center justify-center">
          <span class="absolute inset-0 animate-pulse-ring rounded-full bg-success/40"></span>
          <span class="relative flex h-16 w-16 items-center justify-center rounded-full bg-success text-canvas shadow-glow-success">
            <app-icon name="check" class="h-8 w-8" [stroke]="3" />
          </span>
        </div>
        <h2 class="display mt-6 text-4xl">Pagamento aprovado!</h2>
        <p class="mt-2 text-sm text-ink-muted">Sua entrega já está na fila. Enviamos o comprovante para <span class="text-ink">{{ order.customerEmail }}</span>.</p>

        <div class="mx-auto mt-6 flex max-w-xs items-center justify-between rounded-xl border border-line bg-canvas/50 px-4 py-3">
          <div class="text-left">
            <p class="text-xs text-ink-faint">Código do pedido</p>
            <p class="font-mono text-lg font-semibold tracking-wider">{{ order.id }}</p>
          </div>
          <button type="button" class="rounded-lg p-2 text-ink-muted hover:bg-surface-raised hover:text-ink" (click)="copy(order.id)" aria-label="Copiar código do pedido">
            <app-icon name="copy" class="h-4 w-4" />
          </button>
        </div>

        <a [routerLink]="['/rastreio', order.id]" class="btn-primary mt-8 w-full">
          Acompanhar entrega em tempo real <app-icon name="arrow-right" class="h-4 w-4" />
        </a>
      </div>
    }
  `,
})
export class CheckoutSuccessComponent {
  protected readonly store = inject(CheckoutStore);
  private readonly clipboard = inject(ClipboardService);
  private readonly toast = inject(ToastService);

  protected async copy(id: string): Promise<void> {
    if (await this.clipboard.copy(id)) this.toast.success('Código do pedido copiado.');
  }
}
