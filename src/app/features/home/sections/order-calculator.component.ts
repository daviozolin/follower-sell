import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PLATFORM_LABEL, SERVICE_LABEL } from '../../../core/models';
import { PricingService } from '../../../core/services/pricing.service';
import { OrderSelectionStore } from '../../../core/state/order-selection.store';
import { SectionHeadingComponent } from '../../../shared/ui/section-heading.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { TooltipComponent } from '../../../shared/ui/tooltip.component';

const SLIDER_STEPS = 1000;

/**
 * Calculadora em tempo real. O slider usa escala logarítmica para que
 * 100 e 100.000 sejam igualmente fáceis de alcançar.
 */
@Component({
  selector: 'app-order-calculator',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, IconComponent, TooltipComponent, SectionHeadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-calculator.component.html',
  styleUrl: './order-calculator.component.scss',
})
export class OrderCalculatorComponent {
  protected readonly store = inject(OrderSelectionStore);
  private readonly router = inject(Router);

  protected readonly sliderSteps = SLIDER_STEPS;
  protected readonly limits = this.store.limits;
  protected readonly quote = this.store.quote;
  protected readonly platformLabel = computed(() => PLATFORM_LABEL[this.store.platform()]);
  protected readonly serviceLabel = computed(() => SERVICE_LABEL[this.store.serviceType()]);

  protected readonly sliderPosition = computed(() => {
    const { min, max } = this.limits();
    const ratio = Math.log(this.store.amount() / min) / Math.log(max / min);
    return Math.round(ratio * SLIDER_STEPS);
  });

  protected readonly premiumPct = inject(PricingService).dripPremiumPct;

  protected readonly speedOptions = [
    { value: 'oneshot' as const, label: 'Entrega rápida', icon: 'zap' as const, premium: false, description: 'Tudo de uma vez, em poucas horas.' },
    { value: 'drip' as const, label: 'Entrega gradual', icon: 'drip' as const, premium: true, description: `Um pouco por dia, como o crescimento natural (+${this.premiumPct}%).` },
  ];

  protected onSlider(event: Event): void {
    const { min, max } = this.limits();
    const pos = Number((event.target as HTMLInputElement).value) / SLIDER_STEPS;
    this.store.setAmount(min * Math.pow(max / min, pos));
  }

  protected onAmountInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.store.setAmount(Number(input.value));
    input.value = String(this.store.amount()); // reflete o valor normalizado (limites/step)
  }

  protected checkout(): void {
    this.router.navigate(['/checkout'], { queryParams: this.store.queryParams() });
  }
}
