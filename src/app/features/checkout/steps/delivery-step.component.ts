import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DeliveryMode } from '../../../core/models';
import { PricingService } from '../../../core/services/pricing.service';
import { IconComponent, IconName } from '../../../shared/ui/icon.component';
import { TooltipComponent } from '../../../shared/ui/tooltip.component';
import { CheckoutStore } from '../checkout.store';

@Component({
  selector: 'app-delivery-step',
  standalone: true,
  imports: [DecimalPipe, IconComponent, TooltipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="font-display text-2xl font-bold tracking-tight">Configuração da entrega</h2>
        <p class="mt-1 text-sm text-ink-muted">Escolha como o volume será distribuído ao longo do tempo.</p>
      </div>

      <div role="radiogroup" aria-label="Velocidade de entrega" class="grid gap-3">
        @for (opt of options; track opt.value) {
          @let active = sel.mode() === opt.value;
          <button type="button" role="radio" [attr.aria-checked]="active" (click)="sel.setMode(opt.value)"
                  class="flex items-start gap-4 rounded-xl border p-5 text-left transition-all duration-200"
                  [class]="active ? 'border-accent bg-accent/10 shadow-glow' : 'border-line bg-canvas/40 hover:border-accent/40'">
            <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                  [class]="active ? 'border-accent' : 'border-line'">
              @if (active) { <span class="h-2.5 w-2.5 rounded-full bg-accent"></span> }
            </span>
            <span class="flex-1">
              <span class="flex items-center gap-2 font-semibold">
                <app-icon [name]="opt.icon" class="h-4 w-4 text-accent" /> {{ opt.title }}
                @if (opt.recommended) {
                  <span class="rounded bg-magenta px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Recomendado</span>
                }
              </span>
              <span class="mt-1 block text-sm text-ink-muted">{{ opt.description }}</span>
            </span>
            <span class="whitespace-nowrap text-right font-mono text-xs" [class]="opt.value === 'drip' ? 'text-magenta-soft' : 'text-ink-faint'">{{ opt.extra }}</span>
          </button>
        }
      </div>

      @if (sel.mode() === 'drip') {
        <div class="animate-fade-up rounded-xl border border-line bg-canvas/40 p-5">
          <p class="label flex items-center gap-1.5">
            Ritmo: {{ sel.unitsPerDay() | number }} / dia
            <app-tooltip text="Para perfis com base pequena, prefira ritmos menores: crescimento de até ~10% da base por dia parece natural." />
          </p>
          <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            @for (rate of sel.dripPresets(); track rate) {
              <button type="button" (click)="sel.setUnitsPerDay(rate)"
                      class="rounded-lg border px-3 py-2.5 font-mono text-sm transition-colors"
                      [class]="sel.unitsPerDay() === rate ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink-muted hover:border-ink-faint'">
                {{ rate | number }}
              </button>
            }
          </div>
          @if (paceWarning()) {
            <p class="mt-4 flex items-start gap-2 text-xs text-warning">
              <app-icon name="alert" class="mt-0.5 h-3.5 w-3.5" />
              Esse ritmo representa mais de 10% da sua base atual por dia. Considere um ritmo menor para um crescimento mais natural.
            </p>
          }
        </div>
      }

      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-xl border border-line bg-surface/60 p-4">
          <p class="flex items-center gap-1.5 text-xs text-ink-faint"><app-icon name="zap" class="h-3.5 w-3.5" /> Início</p>
          <p class="mt-1 font-medium">{{ sel.quote().estimate.startsIn }}</p>
        </div>
        <div class="rounded-xl border border-line bg-surface/60 p-4">
          <p class="flex items-center gap-1.5 text-xs text-ink-faint"><app-icon name="clock" class="h-3.5 w-3.5" /> Conclusão estimada</p>
          <p class="mt-1 font-medium">{{ sel.quote().estimate.label }}</p>
        </div>
      </div>

      <div class="flex gap-3">
        <button type="button" class="btn-ghost" (click)="store.goTo('profile')"><app-icon name="chevron-left" class="h-4 w-4" /> Voltar</button>
        <button type="button" class="btn-primary flex-1" (click)="store.goTo('payment')">
          Ir para pagamento <app-icon name="arrow-right" class="h-4 w-4" />
        </button>
      </div>
    </div>
  `,
})
export class DeliveryStepComponent {
  protected readonly store = inject(CheckoutStore);
  protected readonly sel = this.store.selection;
  private readonly pricing = inject(PricingService);

  protected readonly options: { value: DeliveryMode; title: string; description: string; icon: IconName; extra: string; recommended: boolean }[] = [
    {
      value: 'oneshot',
      title: 'One-shot (uma tacada)',
      description: 'Início em até 15 minutos e entrega completa em poucas horas.',
      icon: 'zap',
      extra: 'Preço base',
      recommended: false,
    },
    {
      value: 'drip',
      title: 'Drip-feed (gradual)',
      description: 'Lotes diários agendados, simulando crescimento orgânico. Menor risco.',
      icon: 'drip',
      extra: `Premium +${this.pricing.dripPremiumPct}%`,
      recommended: true,
    },
  ];

  protected readonly paceWarning = computed(() => {
    const followers = this.store.profile()?.preview?.followers;
    return this.sel.serviceType() === 'followers' && !!followers && this.sel.unitsPerDay() > followers * 0.1;
  });
}
