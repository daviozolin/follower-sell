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
  templateUrl: './pix-payment.component.html',
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
