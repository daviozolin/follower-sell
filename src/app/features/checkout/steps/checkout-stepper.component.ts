import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { IconComponent } from '../../../shared/ui/icon.component';
import { CHECKOUT_STEPS, CheckoutStore } from '../checkout.store';

@Component({
  selector: 'app-checkout-stepper',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout-stepper.component.html',
})
export class CheckoutStepperComponent {
  protected readonly store = inject(CheckoutStore);
  protected readonly steps = CHECKOUT_STEPS;
}
