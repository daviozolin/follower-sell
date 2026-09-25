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
  templateUrl: './package-grid.component.html',
})
export class PackageGridComponent {
  protected readonly store = inject(OrderSelectionStore);
  private readonly pricing = inject(PricingService);
  private readonly router = inject(Router);

  protected readonly premiumPct = this.pricing.dripPremiumPct;
  protected readonly serviceLabel = computed(() => SERVICE_LABEL[this.store.serviceType()]);

  protected readonly modeOptions: SegmentOption<DeliveryMode>[] = [
    { value: 'oneshot', label: 'Rápida', icon: 'zap', hint: 'em horas' },
    { value: 'drip', label: 'Gradual', icon: 'drip', hint: `+${this.pricing.dripPremiumPct}%` },
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
