import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, finalize, of, switchMap } from 'rxjs';
import { Order, PaymentMethod } from '../../../core/models';
import { MockOrderService } from '../../../core/services/mock-order.service';
import { MockPaymentService, detectBrand } from '../../../core/services/mock-payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { cardExpiryValidator, digitsOnly, luhnValidator, stripUnsafe } from '../../../core/validators';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { IconComponent } from '../../../shared/ui/icon.component';
import { CheckoutStore } from '../checkout.store';

@Component({
  selector: 'app-payment-step',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, IconComponent, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-step.component.html',
})
export class PaymentStepComponent {
  protected readonly store = inject(CheckoutStore);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly orders = inject(MockOrderService);
  private readonly payments = inject(MockPaymentService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly brand = signal('');

  protected readonly methods: { value: PaymentMethod; label: string; description: string; icon: 'qr' | 'card'; highlight?: string }[] = [
    { value: 'pix', label: 'Pix dinâmico', description: 'Aprovação em segundos, 24/7.', icon: 'qr', highlight: 'Instantâneo' },
    { value: 'credit_card', label: 'Cartão de crédito', description: 'Visa, Mastercard, Elo, Amex. Até 6x.', icon: 'card' },
  ];

  protected readonly terms = this.fb.control(false, Validators.requiredTrue);

  protected readonly card = this.fb.group({
    holderName: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[A-Za-zÀ-ÿ' ]+$/)]],
    number: ['', [Validators.required, luhnValidator]],
    expiry: ['', [Validators.required, cardExpiryValidator]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    installments: [1],
  });

  protected readonly installmentOptions = computed(() => {
    const total = this.store.total();
    return [1, 2, 3, 4, 5, 6].map((n) => {
      const withInterest = n > 3 ? total * (1 + 0.0299 * n) : total;
      const each = (withInterest / n).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      return { value: n, label: `${n}x de ${each}${n > 3 ? ' (com juros)' : ' sem juros'}` };
    });
  });

  protected invalid(name: keyof typeof this.card.controls): boolean {
    const c = this.card.controls[name];
    return c.invalid && c.touched;
  }

  protected formatNumber(): void {
    const c = this.card.controls.number;
    const digits = digitsOnly(c.value).slice(0, 19);
    this.brand.set(digits.length >= 2 ? detectBrand(digits) : '');
    c.setValue(digits.replace(/(\d{4})(?=\d)/g, '$1 '), { emitEvent: false });
  }

  protected formatExpiry(): void {
    const c = this.card.controls.expiry;
    const digits = digitsOnly(c.value).slice(0, 4);
    c.setValue(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits, { emitEvent: false });
  }

  protected pay(): void {
    this.error.set(null);
    this.terms.markAsTouched();
    if (this.terms.invalid) {
      this.error.set('Confirme os termos para continuar.');
      return;
    }
    const method = this.store.paymentMethod();
    if (method === 'credit_card') {
      this.card.markAllAsTouched();
      if (this.card.invalid) {
        this.error.set('Revise os dados do cartão.');
        return;
      }
    }

    this.busy.set(true);
    this.ensureOrder(method)
      .pipe(
        switchMap((order) => {
          this.store.order.set(order);
          return method === 'pix' ? this.startPix(order) : this.chargeCard(order);
        }),
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: (err: Error) => this.error.set(err.message ?? 'Não foi possível concluir o pagamento.'),
      });
  }

  /** Cria o pedido uma única vez; em nova tentativa reaproveita-o. */
  private ensureOrder(method: PaymentMethod): Observable<Order> {
    const existing = this.store.order();
    if (existing) {
      return existing.paymentMethod === method ? of(existing) : this.orders.updatePaymentMethod(existing.id, method);
    }
    return this.orders.createOrder(this.store.orderRequest(method));
  }

  private startPix(order: Order): Observable<unknown> {
    return this.payments.createPixCharge(order).pipe(
      switchMap((charge) => {
        this.store.pixCharge.set(charge);
        this.store.goTo('pix');
        return of(charge);
      }),
    );
  }

  private chargeCard(order: Order): Observable<unknown> {
    const v = this.card.getRawValue();
    return this.payments
      .payWithCard({
        orderId: order.id,
        holderName: stripUnsafe(v.holderName).toUpperCase(),
        number: digitsOnly(v.number),
        expiry: v.expiry,
        cvv: v.cvv,
        installments: Number(v.installments),
      })
      .pipe(
        switchMap((result) => {
          if (!result.approved) throw new Error(result.message);
          // Descarta os dados sensíveis do formulário assim que o gateway responde.
          this.card.reset();
          this.toast.success(`Pagamento aprovado · ${result.brand} final ${result.last4}`);
          this.store.goTo('success');
          return of(result);
        }),
      );
  }
}
