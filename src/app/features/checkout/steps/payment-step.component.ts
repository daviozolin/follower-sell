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
  template: `
    <div class="space-y-6">
      <div>
        <h2 class="font-display text-2xl font-bold tracking-tight">Pagamento</h2>
        <p class="mt-1 text-sm text-ink-muted">Ambiente criptografado. Não armazenamos dados de cartão.</p>
      </div>

      <div role="radiogroup" aria-label="Método de pagamento" class="grid gap-3 sm:grid-cols-2">
        @for (m of methods; track m.value) {
          @let active = store.paymentMethod() === m.value;
          <button type="button" role="radio" [attr.aria-checked]="active" (click)="store.paymentMethod.set(m.value)" [disabled]="busy()"
                  class="relative rounded-xl border p-5 text-left transition-all duration-200"
                  [class]="active ? 'border-accent bg-accent/10 shadow-glow' : 'border-line bg-canvas/40 hover:border-accent/40'">
            @if (m.highlight) {
              <app-badge class="absolute right-3 top-3" tone="success">{{ m.highlight }}</app-badge>
            }
            <app-icon [name]="m.icon" class="h-6 w-6" [class.text-accent-soft]="active" />
            <p class="mt-3 font-semibold">{{ m.label }}</p>
            <p class="mt-1 text-xs text-ink-muted">{{ m.description }}</p>
          </button>
        }
      </div>

      @if (store.paymentMethod() === 'credit_card') {
        <form [formGroup]="card" class="grid animate-fade-up gap-4 sm:grid-cols-2" novalidate (ngSubmit)="pay()">
          <div class="sm:col-span-2">
            <label class="label" for="cc-name">Nome impresso no cartão</label>
            <input id="cc-name" class="input uppercase" formControlName="holderName" autocomplete="cc-name" maxlength="60"
                   [class.input-invalid]="invalid('holderName')" />
          </div>
          <div class="sm:col-span-2">
            <label class="label" for="cc-number">Número do cartão</label>
            <div class="relative">
              <input id="cc-number" class="input pr-24 font-mono tracking-wider" formControlName="number" inputmode="numeric"
                     autocomplete="cc-number" placeholder="0000 0000 0000 0000" maxlength="23" (input)="formatNumber()"
                     [class.input-invalid]="invalid('number')" />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-muted">{{ brand() }}</span>
            </div>
            @if (invalid('number')) { <p class="field-error">Número de cartão inválido.</p> }
          </div>
          <div>
            <label class="label" for="cc-exp">Validade</label>
            <input id="cc-exp" class="input font-mono" formControlName="expiry" inputmode="numeric" autocomplete="cc-exp"
                   placeholder="MM/AA" maxlength="5" (input)="formatExpiry()" [class.input-invalid]="invalid('expiry')" />
            @if (invalid('expiry')) { <p class="field-error">Data inválida ou expirada.</p> }
          </div>
          <div>
            <label class="label" for="cc-cvv">CVV</label>
            <input id="cc-cvv" class="input font-mono" formControlName="cvv" inputmode="numeric" autocomplete="cc-csc" type="password"
                   placeholder="•••" maxlength="4" [class.input-invalid]="invalid('cvv')" />
          </div>
          <div class="sm:col-span-2">
            <label class="label" for="cc-inst">Parcelas</label>
            <select id="cc-inst" class="input" formControlName="installments">
              @for (n of installmentOptions(); track n.value) {
                <option [value]="n.value">{{ n.label }}</option>
              }
            </select>
          </div>
          <p class="text-xs text-ink-faint sm:col-span-2">Ambiente de teste: cartões terminados em <span class="font-mono">0002</span> são recusados. Teste com 4242 4242 4242 4242.</p>
        </form>
      }

      <label class="flex cursor-pointer items-start gap-3 text-sm text-ink-muted">
        <input type="checkbox" class="mt-0.5 h-4 w-4 rounded border-line bg-canvas accent-[rgb(198,255,61)]" [formControl]="terms" />
        <span>Li e concordo com os termos de serviço e confirmo que o perfil informado está público.</span>
      </label>

      @if (error()) {
        <p class="flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/5 p-4 text-sm text-danger" role="alert">
          <app-icon name="alert" class="h-4 w-4" /> {{ error() }}
        </p>
      }

      <div class="flex gap-3">
        <button type="button" class="btn-ghost" (click)="store.goTo('delivery')" [disabled]="busy()">
          <app-icon name="chevron-left" class="h-4 w-4" /> Voltar
        </button>
        <button type="button" class="btn-success flex-1" (click)="pay()" [disabled]="busy()">
          @if (busy()) {
            <app-icon name="loader" class="h-4 w-4 animate-spin" /> Processando…
          } @else {
            <app-icon name="lock" class="h-4 w-4" />
            {{ store.paymentMethod() === 'pix' ? 'Gerar Pix de' : 'Pagar' }} {{ store.total() | currency }}
          }
        </button>
      </div>
    </div>
  `,
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
