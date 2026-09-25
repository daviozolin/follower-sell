import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DeliveryMode, Package, SERVICE_LABEL } from '../../../core/models';
import { PricingService } from '../../../core/services/pricing.service';
import { OrderSelectionStore } from '../../../core/state/order-selection.store';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { SegmentOption, SegmentedControlComponent } from '../../../shared/ui/segmented-control.component';
import { TooltipComponent } from '../../../shared/ui/tooltip.component';

interface PackageCardVm {
  pkg: Package;
  total: number;
  perThousand: number;
  eta: string;
  selected: boolean;
  discountPct: number;
}

@Component({
  selector: 'app-package-grid',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, SegmentedControlComponent, BadgeComponent, IconComponent, TooltipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-2 text-sm text-ink-muted">
        <span>Modo de entrega</span>
        <app-tooltip text="One-shot entrega tudo de uma tacada, em poucas horas. Drip-feed (premium, +{{ premiumPct }}%) fraciona a entrega em lotes diários agendados, imitando crescimento orgânico." />
      </div>
      <app-segmented-control class="w-full sm:w-96" ariaLabel="Modo de entrega" [options]="modeOptions"
                             [value]="store.mode()" (valueChange)="store.setMode($event)" />
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      @for (card of cards(); track card.pkg.id) {
        <article class="card relative flex flex-col p-6 transition-all duration-200 hover:-translate-y-1 hover:border-accent/50"
                 [class]="card.pkg.isPopular ? '!border-magenta shadow-glow-magenta' : card.selected ? '!border-accent/70' : ''">
          @if (card.pkg.isPopular) {
            <span class="absolute -top-3 left-6 -rotate-2 rounded-md bg-magenta px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Mais escolhido</span>
          }
          <p class="text-sm text-ink-muted">{{ serviceLabel() }}</p>
          <p class="display mt-1 text-5xl">{{ card.pkg.amount | number }}</p>

          <div class="mt-5 flex items-baseline gap-2">
            <span class="font-display text-2xl font-bold tracking-tight">{{ card.total | currency }}</span>
            @if (card.discountPct) {
              <app-badge tone="success">-{{ card.discountPct }}%</app-badge>
            }
          </div>
          <p class="mt-1 text-xs text-ink-faint">{{ card.perThousand | currency }} / mil · prazo {{ card.eta }}</p>

          <ul class="mt-6 flex-1 space-y-2.5 text-sm">
            @for (feature of card.pkg.features; track feature) {
              <li class="flex items-center gap-2.5 text-ink-muted">
                <app-icon name="check" class="h-4 w-4 text-success" [stroke]="2.4" /> {{ feature }}
              </li>
            }
          </ul>

          <button type="button" (click)="choose(card.pkg)" class="mt-6 w-full"
                  [class]="card.pkg.isPopular ? 'btn-magenta' : 'btn-ghost'">
            Selecionar <app-icon name="arrow-right" class="h-4 w-4" />
          </button>
        </article>
      }
    </div>

    <div class="mt-6 flex flex-wrap justify-center gap-2">
      <app-badge tone="accent"><app-icon name="shield" class="h-3.5 w-3.5" /> Garantia 30 dias</app-badge>
      <app-badge tone="magenta"><app-icon name="refresh" class="h-3.5 w-3.5" /> Reposição automática</app-badge>
      <app-badge tone="neutral"><app-icon name="lock" class="h-3.5 w-3.5" /> 100% seguro (sem senha)</app-badge>
    </div>
  `,
})
export class PackageGridComponent {
  protected readonly store = inject(OrderSelectionStore);
  private readonly pricing = inject(PricingService);
  private readonly router = inject(Router);

  protected readonly premiumPct = this.pricing.dripPremiumPct;
  protected readonly serviceLabel = computed(() => SERVICE_LABEL[this.store.serviceType()]);

  protected readonly modeOptions: SegmentOption<DeliveryMode>[] = [
    { value: 'oneshot', label: 'One-shot', icon: 'zap', hint: 'uma tacada' },
    { value: 'drip', label: 'Drip-feed', icon: 'drip', hint: `+${this.pricing.dripPremiumPct}%` },
  ];

  /** Preço de cada card recalculado quando plataforma, serviço ou modo mudam. */
  protected readonly cards = computed<PackageCardVm[]>(() => {
    const mode = this.store.mode();
    return this.store.packages().map((pkg) => {
      const q = this.pricing.quote(pkg.platform, pkg.serviceType, pkg.amount, mode);
      return {
        pkg,
        total: q.total,
        perThousand: (q.total / pkg.amount) * 1000,
        eta: q.estimate.label,
        discountPct: q.discountPct,
        selected: this.store.amount() === pkg.amount,
      };
    });
  });

  protected choose(pkg: Package): void {
    this.store.selectPackage(pkg);
    this.router.navigate(['/checkout'], { queryParams: this.store.queryParams() });
  }
}
