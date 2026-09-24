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
  template: `
    <section class="container-page py-10 lg:py-14">
      <div class="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="eyebrow flex items-center gap-2"><app-icon name="lock" class="h-3.5 w-3.5" /> Checkout seguro</p>
          <h1 class="mt-2 text-3xl font-semibold tracking-tight">Finalize seu pedido</h1>
        </div>
        @if (store.stepIndex() < 3) {
          <app-checkout-stepper class="w-full sm:max-w-md" />
        }
      </div>

      <div class="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div class="card p-6 sm:p-8">
          @switch (store.step()) {
            @case ('profile') { <app-profile-step /> }
            @case ('delivery') { <app-delivery-step /> }
            @case ('payment') { <app-payment-step /> }
            @case ('pix') { <app-pix-payment /> }
            @case ('success') { <app-checkout-success /> }
          }
        </div>
        <app-order-summary />
      </div>
    </section>
  `,
})
export class CheckoutPage implements OnInit {
  protected readonly store = inject(CheckoutStore);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    this.store.selection.hydrate({
      platform: q.get('platform'),
      service: q.get('service'),
      amount: q.get('amount'),
      mode: q.get('mode'),
    });
  }
}
