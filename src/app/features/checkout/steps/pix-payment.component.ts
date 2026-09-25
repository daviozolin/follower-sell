import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { interval, map, startWith } from 'rxjs';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { MockPaymentService } from '../../../core/services/mock-payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { QrCodeComponent } from '../../../shared/ui/qr-code.component';
import { CheckoutStore } from '../checkout.store';

@Component({
  selector: 'app-pix-payment',
  standalone: true,
  imports: [CurrencyPipe, IconComponent, BadgeComponent, QrCodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (charge(); as c) {
      <div class="space-y-6 text-center">
        <div>
          <h2 class="font-display text-2xl font-bold tracking-tight">Pague com Pix</h2>
          <p class="mt-1 text-sm text-ink-muted">Escaneie o QR Code ou use o código "copia e cola" no app do seu banco.</p>
        </div>

        <div class="flex flex-col items-center gap-4">
          @switch (c.status) {
            @case ('awaiting') {
              <app-badge tone="warning" [dot]="true" [pulse]="true">Aguardando pagamento…</app-badge>
            }
            @case ('paid') {
              <app-badge tone="success" [dot]="true">Pagamento confirmado</app-badge>
            }
            @case ('expired') {
              <app-badge tone="danger" [dot]="true">Código expirado</app-badge>
            }
          }

          <div class="relative rounded-2xl border border-line bg-canvas/50 p-4 transition-opacity" [class.opacity-30]="c.status === 'expired'">
            <app-qr-code class="block h-52 w-52 sm:h-56 sm:w-56" [payload]="c.brCode" />
            <span class="absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-full border border-line bg-surface px-2.5 py-0.5 text-[10px] text-ink-faint">QR ilustrativo · teste</span>
          </div>

          <p class="text-3xl font-semibold tracking-tight">{{ c.amount | currency }}</p>

          @if (c.status === 'awaiting') {
            <div class="flex items-center gap-2 text-sm" [class.text-warning]="secondsLeft() < 120" [class.text-ink-muted]="secondsLeft() >= 120">
              <app-icon name="clock" class="h-4 w-4" />
              Expira em <span class="font-mono text-lg font-semibold tabular-nums">{{ countdown() }}</span>
            </div>
            <div class="h-1 w-full max-w-xs overflow-hidden rounded-full bg-line">
              <div class="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear" [style.width.%]="progress()"></div>
            </div>
          }
        </div>

        @if (c.status !== 'expired') {
          <div class="text-left">
            <label class="label" for="brcode">Pix copia e cola</label>
            <div class="flex gap-2">
              <input id="brcode" readonly class="input truncate font-mono text-xs" [value]="c.brCode" (focus)="selectAll($event)" />
              <button type="button" (click)="copy(c.brCode)" class="btn shrink-0 border transition-all duration-300"
                      [class]="copied() ? 'border-success/50 bg-success/15 text-success' : 'border-line bg-surface-raised text-ink hover:border-accent/60'"
                      [attr.aria-label]="copied() ? 'Código copiado' : 'Copiar código Pix'">
                <app-icon [name]="copied() ? 'check' : 'copy'" class="h-4 w-4" [stroke]="copied() ? 2.6 : 1.8" />
                <span class="hidden sm:inline">{{ copied() ? 'Copiado!' : 'Copiar' }}</span>
              </button>
            </div>
          </div>
        }

        @if (c.status === 'expired') {
          <button type="button" class="btn-primary w-full" (click)="regenerate()" [disabled]="busy()">
            <app-icon name="refresh" class="h-4 w-4" /> Gerar novo código
          </button>
        } @else if (c.status === 'awaiting') {
          <ol class="space-y-2 rounded-xl border border-line bg-canvas/40 p-4 text-left text-sm text-ink-muted">
            <li>1. Abra o app do seu banco e escolha <strong class="text-ink">Pix → Pagar</strong>.</li>
            <li>2. Escaneie o QR Code ou cole o código.</li>
            <li>3. Confirme — a aprovação aparece aqui automaticamente.</li>
          </ol>
          <button type="button" class="btn-ghost w-full border-dashed" (click)="simulatePaid()" [disabled]="busy()">
            @if (busy()) { <app-icon name="loader" class="h-4 w-4 animate-spin" /> } @else { <app-icon name="sparkles" class="h-4 w-4 text-accent-soft" /> }
            Simular pagamento aprovado (ambiente de teste)
          </button>
        }
      </div>
    }
  `,
})
export class PixPaymentComponent {
  private readonly store = inject(CheckoutStore);
  private readonly payments = inject(MockPaymentService);
  private readonly clipboard = inject(ClipboardService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  /** Signal vivo da cobrança: reflete confirmações/expiração do "PSP". */
  protected readonly charge = computed(() => {
    const id = this.store.pixCharge()?.id;
    return id ? this.payments.watchCharge(id)() : undefined;
  });

  private readonly now = toSignal(interval(1000).pipe(startWith(0), map(() => Date.now())), { initialValue: Date.now() });
  private readonly totalSeconds = computed(() => {
    const c = this.store.pixCharge();
    return c ? Math.round((new Date(c.expiresAt).getTime() - Date.now()) / 1000) : 1;
  });
  protected readonly secondsLeft = computed(() => {
    const c = this.charge();
    return c ? Math.max(0, Math.floor((new Date(c.expiresAt).getTime() - this.now()) / 1000)) : 0;
  });
  protected readonly countdown = computed(() => {
    const s = this.secondsLeft();
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  });
  protected readonly progress = computed(() => (this.secondsLeft() / Math.max(1, this.totalSeconds())) * 100);

  protected readonly copied = signal(false);
  protected readonly busy = signal(false);
  private copyTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Expiração e confirmação reagem ao estado — sem polling manual.
    effect(() => {
      const c = this.charge();
      if (!c) return;
      if (c.status === 'awaiting' && this.secondsLeft() === 0) untracked(() => this.payments.markExpired(c.id));
      if (c.status === 'paid') untracked(() => this.store.goTo('success'));
    });
    this.destroyRef.onDestroy(() => clearTimeout(this.copyTimer));
  }

  protected async copy(code: string): Promise<void> {
    const ok = await this.clipboard.copy(code);
    if (!ok) {
      this.toast.error('Não foi possível copiar. Selecione o código manualmente.');
      return;
    }
    this.copied.set(true);
    this.toast.success('Código Pix copiado!');
    clearTimeout(this.copyTimer);
    this.copyTimer = setTimeout(() => this.copied.set(false), 2200);
  }

  protected selectAll(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  protected simulatePaid(): void {
    const c = this.charge();
    if (!c) return;
    this.busy.set(true);
    this.payments
      .simulatePixPaid(c.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.busy.set(false),
        error: (e: Error) => {
          this.busy.set(false);
          this.toast.error(e.message);
        },
      });
  }

  protected regenerate(): void {
    const order = this.store.order();
    if (!order) return;
    this.busy.set(true);
    this.payments
      .createPixCharge(order)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((charge) => {
        this.store.pixCharge.set(charge);
        this.busy.set(false);
      });
  }
}
