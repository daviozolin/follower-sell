import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IconComponent } from '../../shared/ui/icon.component';
import { CheckoutStore } from './checkout.store';
import { CheckoutStepperComponent } from './steps/checkout-stepper.component';
import { CheckoutSuccessComponent } from './steps/checkout-success.component';
import { DeliveryStepComponent } from './steps/delivery-step.component';
import { OrderSummaryComponent } from './steps/order-summary.component';
import { PaymentStepComponent } from './steps/payment-step.component';
import { PixPaymentComponent } from './steps/pix-payment.component';
import { ProfileStepComponent } from './steps/profile-step.component';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  providers: [CheckoutStore],
  imports: [
    IconComponent,
    CheckoutStepperComponent,
    OrderSummaryComponent,
    ProfileStepComponent,
    DeliveryStepComponent,
    PaymentStepComponent,
    PixPaymentComponent,
    CheckoutSuccessComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout.page.html',
})
export class CheckoutPage implements OnInit {
  protected readonly store = inject(CheckoutStore);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    if (q.get('combo')) {
      const platform = q.get('platform') === 'tiktok' ? 'tiktok' : 'instagram';
      const pace = q.get('pace');
      const base = Number(q.get('base'));
      this.store.startCombo(
        platform,
        Number.isFinite(base) ? Math.min(5_000_000, base) : 5_000,
        pace === 'intense' || pace === 'gentle' ? pace : 'natural',
      );
      return;
    }
    this.store.selection.hydrate({
      platform: q.get('platform'),
      service: q.get('service'),
      amount: q.get('amount'),
      mode: q.get('mode'),
    });
  }
}
