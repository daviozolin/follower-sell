import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PLATFORM_LABEL, SERVICE_LABEL } from '../../../core/models';
import { IconComponent } from '../../../shared/ui/icon.component';
import { CheckoutStore } from '../checkout.store';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="card p-6 lg:sticky lg:top-24" aria-label="Resumo do pedido">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">Resumo</h2>
        @if (!store.locked()) {
          <a routerLink="/" fragment="servicos" class="text-xs text-accent-soft hover:underline">Alterar</a>
        }
      </div>

      <div class="mt-5 flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-canvas/60">
          <app-icon [name]="sel.platform()" class="h-5 w-5 text-accent-soft" />
        </span>
        <div>
          <p class="font-medium">{{ sel.amount() | number }} {{ serviceLabel() }}</p>
          <p class="text-xs text-ink-muted">{{ platformLabel() }}</p>
        </div>
      </div>

      <dl class="mt-5 space-y-2.5 border-t border-line/70 pt-5 text-sm">
        @if (store.profile(); as p) {
          <div class="flex justify-between gap-4">
            <dt class="text-ink-muted">Destino</dt>
            <dd class="truncate font-mono text-xs">{{ store.targetKind() === 'profile' ? '@' + p.target : p.target }}</dd>
          </div>
        }
        <div class="flex justify-between">
          <dt class="text-ink-muted">Entrega</dt>
          <dd>{{ sel.mode() === 'turbo' ? 'Turbo' : 'Gradual · ' + (sel.unitsPerDay() | number) + '/dia' }}</dd>
        </div>
        <div class="flex justify-between"><dt class="text-ink-muted">Prazo</dt><dd>{{ sel.quote().estimate.label }}</dd></div>
        @if (sel.quote().discount) {
          <div class="flex justify-between text-success"><dt>Desconto</dt><dd>-{{ sel.quote().discount | currency }}</dd></div>
        }
        @if (sel.quote().turboSurcharge) {
          <div class="flex justify-between"><dt class="text-ink-muted">Turbo</dt><dd>+{{ sel.quote().turboSurcharge | currency }}</dd></div>
        }
      </dl>

      <div class="mt-5 flex items-baseline justify-between border-t border-dashed border-line pt-5">
        <span class="text-sm text-ink-muted">Total</span>
        <span class="text-2xl font-semibold tabular-nums">{{ sel.quote().total | currency }}</span>
      </div>

      <ul class="mt-6 space-y-2 text-xs text-ink-muted">
        <li class="flex items-center gap-2"><app-icon name="shield" class="h-4 w-4 text-success" /> Garantia de reposição por 30 dias</li>
        <li class="flex items-center gap-2"><app-icon name="key" class="h-4 w-4 text-success" /> Nunca pedimos sua senha</li>
        <li class="flex items-center gap-2"><app-icon name="lock" class="h-4 w-4 text-success" /> Pagamento criptografado</li>
      </ul>
    </aside>
  `,
})
export class OrderSummaryComponent {
  protected readonly store = inject(CheckoutStore);
  protected readonly sel = this.store.selection;
  protected readonly platformLabel = computed(() => PLATFORM_LABEL[this.sel.platform()]);
  protected readonly serviceLabel = computed(() => SERVICE_LABEL[this.sel.serviceType()].toLowerCase());
}
