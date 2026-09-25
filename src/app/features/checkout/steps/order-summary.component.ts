import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BUNDLE_PACE_LABEL, PLATFORM_LABEL, SERVICE_LABEL } from '../../../core/models';
import { IconComponent } from '../../../shared/ui/icon.component';
import { CheckoutStore } from '../checkout.store';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, RouterLink, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-summary.component.html',
})
export class OrderSummaryComponent {
  protected readonly store = inject(CheckoutStore);
  protected readonly sel = this.store.selection;
  protected readonly platformLabel = computed(() => PLATFORM_LABEL[this.store.platform()]);
  protected readonly paceLabel = computed(() => {
    const plan = this.store.bundle();
    return plan ? BUNDLE_PACE_LABEL[plan.pace] : '';
  });
  protected readonly serviceLabel = computed(() => SERVICE_LABEL[this.sel.serviceType()].toLowerCase());
}
