import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PLATFORM_LABEL, SERVICE_LABEL } from '../../../core/models';
import { OrderSelectionStore } from '../../../core/state/order-selection.store';
import { BadgeComponent } from '../../../shared/ui/badge.component';
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
  imports: [CurrencyPipe, DecimalPipe, IconComponent, BadgeComponent, TooltipComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card grid overflow-hidden lg:grid-cols-[1.35fr_1fr]">
      <div class="p-6 sm:p-8">
        <p class="eyebrow">Calculadora</p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight">Monte um pedido sob medida</h2>
        <p class="mt-2 text-sm text-ink-muted">
          {{ platformLabel() }} · {{ serviceLabel() }} — altere plataforma e serviço no seletor acima.
        </p>

        <div class="mt-8">
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
                  <app-icon [name]="opt.icon" class="h-4 w-4" [class.text-accent-soft]="active" /> {{ opt.label }}
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
                        [class]="store.unitsPerDay() === rate ? 'border-success/60 bg-success/10 text-success' : 'border-line text-ink-muted hover:border-ink-faint'">
                  {{ rate | number }}/dia
                </button>
              }
            </div>
          </div>
        }
      </div>

      <aside class="flex flex-col border-t border-line/70 bg-canvas/50 p-6 sm:p-8 lg:border-l lg:border-t-0" aria-live="polite">
        <p class="text-sm text-ink-muted">Resumo</p>
        <dl class="mt-4 space-y-3 text-sm">
          <div class="flex justify-between"><dt class="text-ink-muted">{{ quote().amount | number }} × {{ quote().unitPricePerThousand | currency }}/mil</dt><dd>{{ quote().subtotal | currency }}</dd></div>
          @if (quote().discount) {
            <div class="flex justify-between text-success"><dt>Desconto por volume ({{ quote().discountPct }}%)</dt><dd>-{{ quote().discount | currency }}</dd></div>
          }
          @if (quote().turboSurcharge) {
            <div class="flex justify-between"><dt class="text-ink-muted">Entrega turbo</dt><dd>+{{ quote().turboSurcharge | currency }}</dd></div>
          }
        </dl>
        <div class="my-5 border-t border-dashed border-line"></div>
        <div class="flex items-baseline justify-between">
          <span class="text-sm text-ink-muted">Total</span>
          <span class="text-4xl font-semibold tracking-tight tabular-nums">{{ quote().total | currency }}</span>
        </div>
        <div class="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-xl border border-line bg-surface/60 p-3">
            <p class="flex items-center gap-1.5 text-xs text-ink-faint"><app-icon name="clock" class="h-3.5 w-3.5" /> Prazo estimado</p>
            <p class="mt-1 font-medium">{{ quote().estimate.label }}</p>
          </div>
          <div class="rounded-xl border border-line bg-surface/60 p-3">
            <p class="flex items-center gap-1.5 text-xs text-ink-faint"><app-icon name="zap" class="h-3.5 w-3.5" /> Início</p>
            <p class="mt-1 font-medium">{{ quote().estimate.startsIn }}</p>
          </div>
        </div>
        <div class="mt-5 flex flex-wrap gap-2">
          <app-badge tone="success">Garantia 30 dias</app-badge>
          <app-badge tone="neutral">Sem senha</app-badge>
        </div>
        <button type="button" class="btn-primary mt-7 w-full" (click)="checkout()">
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

  protected readonly speedOptions = [
    { value: 'drip' as const, label: 'Orgânica (drip-feed)', icon: 'drip' as const, description: 'Lotes diários, padrão natural.' },
    { value: 'turbo' as const, label: 'Turbo', icon: 'zap' as const, description: 'Início imediato, conclui em horas.' },
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
