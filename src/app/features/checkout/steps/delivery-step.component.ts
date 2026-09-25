import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { BUNDLE_PACE_LABEL, DeliveryMode, SERVICE_LABEL } from '../../../core/models';
import { BundleService } from '../../../core/services/bundle.service';
import { BundleScheduleChartComponent } from '../../../shared/ui/bundle-schedule-chart.component';
import { PricingService } from '../../../core/services/pricing.service';
import { IconComponent, IconName } from '../../../shared/ui/icon.component';
import { TooltipComponent } from '../../../shared/ui/tooltip.component';
import { CheckoutStore } from '../checkout.store';

@Component({
  selector: 'app-delivery-step',
  standalone: true,
  imports: [DecimalPipe, IconComponent, TooltipComponent, BundleScheduleChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './delivery-step.component.html',
})
export class DeliveryStepComponent {
  protected readonly store = inject(CheckoutStore);
  protected readonly sel = this.store.selection;
  private readonly pricing = inject(PricingService);
  private readonly bundles = inject(BundleService);

  protected readonly options: { value: DeliveryMode; title: string; description: string; icon: IconName; extra: string; recommended: boolean }[] = [
    {
      value: 'oneshot',
      title: 'Entrega rápida',
      description: 'Tudo de uma vez: começa em até 15 minutos e termina em poucas horas.',
      icon: 'zap',
      extra: 'Preço base',
      recommended: false,
    },
    {
      value: 'drip',
      title: 'Entrega gradual',
      description: 'Um pouco por dia, como um perfil que cresce naturalmente. Mais discreto e seguro.',
      icon: 'drip',
      extra: `+${this.pricing.dripPremiumPct}%`,
      recommended: true,
    },
  ];

  protected readonly serviceLabel = SERVICE_LABEL;

  /** Opções de ritmo com dias e ajuste de preço calculados para a base atual. */
  protected readonly paceOptions = computed(() => {
    const plan = this.store.bundle();
    if (!plan) return [];
    return (['intense', 'natural', 'gentle'] as const).map((pace) => {
      const p = this.bundles.plan(plan.platform, plan.baseFollowers, pace);
      return {
        value: pace,
        label: BUNDLE_PACE_LABEL[pace],
        days: p.durationDays,
        adj: p.paceAdjustmentPct === 0 ? 'preço base' : `${p.paceAdjustmentPct > 0 ? '+' : ''}${p.paceAdjustmentPct}%`,
      };
    });
  });

  protected readonly paceWarning = computed(() => {
    const followers = this.store.profile()?.preview?.followers;
    return this.sel.serviceType() === 'followers' && !!followers && this.sel.unitsPerDay() > followers * 0.1;
  });
}
