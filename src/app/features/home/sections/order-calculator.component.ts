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
  template: `
    <app-section-heading index="02" eyebrow="Calculadora">
      <span title>Quantidade exata.<br /><span class="text-magenta">Preço na hora.</span></span>
      <span subtitle>{{ platformLabel() }} · {{ serviceLabel() }} — altere plataforma e serviço no seletor acima.</span>
    </app-section-heading>

    <div class="mt-12 grid overflow-hidden rounded-3xl border border-line bg-surface shadow-card lg:grid-cols-[1.35fr_1fr]">
      <div class="p-6 sm:p-10">
        <div>
          <div class="flex items-end justify-between gap-4">
            <label for="calc-amount" class="label !mb-0">Quantidade</label>
            <div class="flex items-center gap-2">
              <input id="calc-amount" type="number" inputmode="numeric" class="input w-32 !py-2 text-right font-mono"
                     [min]="limits().min" [max]="limits().max" [step]="limits().step"
                     [value]="store.amount()" (change)="onAmountInput($event)" />
            </div>
          </div>
          <input type="range" class="range mt-5 w-full" aria-label="Quantidade (slider)"
                 [min]="0" [max]="sliderSteps" [value]="sliderPosition()" (input)="onSlider($event)"
                 [style.--fill]="(sliderPosition() / sliderSteps) * 100 + '%'" />
          <div class="mt-2 flex justify-between font-mono text-[11px] text-ink-faint">
            <span>{{ limits().min | number }}</span><span>{{ limits().max | number }}</span>
          </div>
        </div>

        <fieldset class="mt-8">
          <legend class="label">Velocidade</legend>
          <div class="grid gap-3 sm:grid-cols-2">
            @for (opt of speedOptions; track opt.value) {
              @let active = store.mode() === opt.value;
              <button type="button" (click)="store.setMode(opt.value)" [attr.aria-pressed]="active"
                      class="rounded-xl border p-4 text-left transition-all duration-200"
                      [class]="active ? 'border-accent bg-accent/10 shadow-glow' : 'border-line bg-canvas/40 hover:border-accent/40'">
                <span class="flex items-center gap-2 font-medium">
                  <app-icon [name]="opt.icon" class="h-4 w-4" [class.text-accent]="active" /> {{ opt.label }}
                  @if (opt.premium) {
                    <span class="ml-auto rounded bg-magenta px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">Premium</span>
                  }
                </span>
                <span class="mt-1 block text-xs text-ink-muted">{{ opt.description }}</span>
              </button>
            }
          </div>
        </fieldset>

        @if (store.mode() === 'drip') {
          <div class="mt-6 animate-fade-up">
            <p class="label flex items-center gap-1.5">
              Ritmo diário
              <app-tooltip text="Quanto menor o ritmo, mais natural o crescimento aparenta. Recomendamos no máximo 10% da base atual por dia." />
            </p>
            <div class="flex flex-wrap gap-2">
              @for (rate of store.dripPresets(); track rate) {
                <button type="button" (click)="store.setUnitsPerDay(rate)"
                        class="rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors"
                        [class]="store.unitsPerDay() === rate ? 'border-accent bg-accent/10 text-accent' : 'border-line text-ink-muted hover:border-ink-faint'">
                  {{ rate | number }}/dia
                </button>
              }
            </div>
          </div>
        }
      </div>

      <!-- Resumo invertido: fundo limão, texto escuro -->
      <aside class="flex flex-col bg-accent p-6 text-accent-ink sm:p-10" aria-live="polite">
        <p class="font-mono text-[11px] uppercase tracking-[0.22em] text-accent-ink/60">Resumo</p>
        <dl class="mt-5 space-y-3 text-sm">
          <div class="flex justify-between"><dt class="text-accent-ink/70">{{ quote().amount | number }} × {{ quote().unitPricePerThousand | currency }}/mil</dt><dd class="font-medium">{{ quote().subtotal | currency }}</dd></div>
          @if (quote().discount) {
            <div class="flex justify-between"><dt class="text-accent-ink/70">Desconto por volume ({{ quote().discountPct }}%)</dt><dd class="font-medium">-{{ quote().discount | currency }}</dd></div>
          }
          @if (quote().dripPremium) {
            <div class="flex justify-between"><dt class="text-accent-ink/70">Drip-feed premium (+{{ premiumPct }}%)</dt><dd class="font-medium">+{{ quote().dripPremium | currency }}</dd></div>
          }
        </dl>
        <div class="my-6 border-t-2 border-dashed border-accent-ink/20"></div>
        <p class="text-sm text-accent-ink/70">Total</p>
        <p class="display mt-1 text-5xl tabular-nums sm:text-6xl">{{ quote().total | currency }}</p>
        <div class="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-xl bg-accent-ink/[0.07] p-3">
            <p class="flex items-center gap-1.5 text-xs text-accent-ink/60"><app-icon name="clock" class="h-3.5 w-3.5" /> Conclusão</p>
            <p class="mt-1 font-semibold">{{ quote().estimate.label }}</p>
          </div>
          <div class="rounded-xl bg-accent-ink/[0.07] p-3">
            <p class="flex items-center gap-1.5 text-xs text-accent-ink/60"><app-icon name="zap" class="h-3.5 w-3.5" /> Início</p>
            <p class="mt-1 font-semibold">{{ quote().estimate.startsIn }}</p>
          </div>
        </div>
        <p class="mt-5 flex items-center gap-2 text-xs font-medium text-accent-ink/70">
          <app-icon name="shield" class="h-4 w-4" /> Garantia 30 dias · Sem senha
        </p>
        <button type="button" class="btn mt-8 w-full bg-canvas text-ink hover:bg-surface-raised hover:shadow-brutal active:scale-[0.98]" (click)="checkout()">
          Continuar para o checkout <app-icon name="arrow-right" class="h-4 w-4" />
        </button>
      </aside>
    </div>
  `,
  styles: `
    .range { appearance: none; height: 6px; border-radius: 999px; cursor: pointer;
      background: linear-gradient(90deg, rgb(var(--color-accent)) var(--fill), rgb(var(--color-line)) var(--fill)); }
    .range::-webkit-slider-thumb { appearance: none; width: 22px; height: 22px; border-radius: 999px; background: #fff;
      border: 4px solid rgb(var(--color-accent)); box-shadow: 0 0 0 6px rgb(var(--color-accent) / 0.2); transition: transform .15s; }
    .range::-webkit-slider-thumb:hover { transform: scale(1.12); }
    .range::-moz-range-thumb { width: 14px; height: 14px; border-radius: 999px; background: #fff;
      border: 4px solid rgb(var(--color-accent)); box-shadow: 0 0 0 6px rgb(var(--color-accent) / 0.2); }
  `,
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
    { value: 'oneshot' as const, label: 'One-shot', icon: 'zap' as const, premium: false, description: 'Tudo de uma tacada, conclui em horas.' },
    { value: 'drip' as const, label: 'Drip-feed', icon: 'drip' as const, premium: true, description: `Lotes diários, padrão orgânico (+${this.premiumPct}%).` },
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
