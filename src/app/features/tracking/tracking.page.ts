import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { Order, PLATFORM_LABEL, SERVICE_LABEL } from '../../core/models';
import { MockOrderService } from '../../core/services/mock-order.service';
import { ToastService } from '../../core/services/toast.service';
import { STRICT_EMAIL, stripUnsafe } from '../../core/validators';
import { IconComponent } from '../../shared/ui/icon.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { OrderStatusBadgeComponent } from '../../shared/ui/order-status-badge.component';
import { TooltipComponent } from '../../shared/ui/tooltip.component';
import { OrderTimelineComponent } from './components/order-timeline.component';

const ORDER_CODE = /^PG-[A-Z0-9]{6}$/;

type LoadState = 'idle' | 'loading' | 'ready' | 'not_found';

@Component({
  selector: 'app-tracking-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    IconComponent,
    ModalComponent,
    OrderStatusBadgeComponent,
    OrderTimelineComponent,
    TooltipComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="container-page max-w-4xl py-10 lg:py-14">
      <p class="eyebrow">Rastreio</p>
      <h1 class="mt-2 text-3xl font-semibold tracking-tight">Acompanhe seu pedido</h1>
      <p class="mt-2 text-ink-muted">Busque pelo código do pedido (ex.: <button type="button" class="font-mono text-accent-soft hover:underline" (click)="fillDemo()">PG-DEMO02</button>) ou pelo e-mail da compra.</p>

      <form [formGroup]="search" (ngSubmit)="submit()" class="mt-6 flex flex-col gap-3 sm:flex-row" novalidate>
        <div class="relative flex-1">
          <app-icon name="search" class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input formControlName="query" class="input pl-11" placeholder="PG-XXXXXX ou voce@email.com" maxlength="254"
                 autocomplete="off" spellcheck="false" aria-label="Código do pedido ou e-mail"
                 [class.input-invalid]="search.controls.query.touched && search.invalid" />
        </div>
        <button type="submit" class="btn-primary" [disabled]="searching()">
          @if (searching()) { <app-icon name="loader" class="h-4 w-4 animate-spin" /> } Buscar
        </button>
      </form>
      @if (searchError()) { <p class="field-error">{{ searchError() }}</p> }

      <!-- Resultados de busca por e-mail -->
      @if (results(); as list) {
        <div class="mt-6 space-y-2 animate-fade-up">
          @for (o of list; track o.id) {
            <a [routerLink]="['/rastreio', o.id]" class="card flex items-center justify-between gap-4 p-4 transition-colors hover:border-accent/50">
              <div class="flex items-center gap-3">
                <app-icon [name]="o.platform" class="h-5 w-5 text-accent-soft" />
                <div>
                  <p class="font-mono text-sm font-semibold">{{ o.id }}</p>
                  <p class="text-xs text-ink-muted">{{ o.amount | number }} {{ serviceLabel(o) }} · {{ o.createdAt | date: 'dd/MM/yyyy' }}</p>
                </div>
              </div>
              <app-order-status-badge [status]="o.status" />
            </a>
          } @empty {
            <p class="card p-6 text-center text-sm text-ink-muted">Nenhum pedido encontrado para este e-mail.</p>
          }
        </div>
      }

      <!-- Detalhe do pedido -->
      @switch (loadState()) {
        @case ('loading') {
          <div class="card mt-8 animate-pulse space-y-4 p-8">
            <div class="h-5 w-1/3 rounded bg-surface-raised"></div>
            <div class="h-24 rounded bg-surface-raised"></div>
          </div>
        }
        @case ('not_found') {
          <div class="card mt-8 flex flex-col items-center p-10 text-center">
            <app-icon name="search" class="h-8 w-8 text-ink-faint" />
            <p class="mt-4 font-medium">Pedido não encontrado</p>
            <p class="mt-1 text-sm text-ink-muted">Confira o código enviado no seu e-mail de confirmação.</p>
          </div>
        }
        @case ('ready') {
          @if (order(); as o) {
            <article class="card mt-8 animate-fade-up overflow-hidden">
              <header class="flex flex-col gap-4 border-b border-line/70 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <div>
                  <p class="text-xs text-ink-faint">Pedido</p>
                  <p class="font-mono text-xl font-semibold tracking-wider">{{ o.id }}</p>
                </div>
                <app-order-status-badge [status]="o.status" />
              </header>

              <div class="p-6 sm:p-8">
                <app-order-timeline [order]="o" />

                <dl class="mt-8 grid gap-4 text-sm sm:grid-cols-4">
                  <div><dt class="text-xs text-ink-faint">Serviço</dt><dd class="mt-1">{{ o.amount | number }} {{ serviceLabel(o) }}</dd></div>
                  <div><dt class="text-xs text-ink-faint">Plataforma</dt><dd class="mt-1">{{ platformLabel(o) }}</dd></div>
                  <div><dt class="text-xs text-ink-faint">Entrega</dt><dd class="mt-1">{{ o.deliverySpeed.mode === 'turbo' ? 'Turbo' : 'Gradual · ' + (o.deliverySpeed.unitsPerDay | number) + '/dia' }}</dd></div>
                  <div><dt class="text-xs text-ink-faint">Total</dt><dd class="mt-1">{{ o.totalPrice | currency }}</dd></div>
                  <div class="sm:col-span-4"><dt class="text-xs text-ink-faint">Destino</dt><dd class="mt-1 truncate font-mono text-xs">{{ o.serviceType === 'followers' ? '@' + o.targetHandle : o.targetHandle }}</dd></div>
                </dl>
              </div>

              <footer class="flex flex-col gap-4 border-t border-line/70 bg-canvas/40 p-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div class="text-sm">
                  @if (o.guaranteeUntil) {
                    <p class="flex items-center gap-2 text-ink-muted">
                      <app-icon name="shield" class="h-4 w-4 text-success" />
                      Garantia ativa até <span class="text-ink">{{ o.guaranteeUntil | date: 'dd/MM/yyyy' }}</span>
                    </p>
                    @if (o.refillCount) { <p class="mt-1 text-xs text-ink-faint">{{ o.refillCount }} reposição(ões) realizada(s)</p> }
                  } @else {
                    <p class="flex items-center gap-2 text-ink-muted"><app-icon name="shield" class="h-4 w-4" /> Garantia de 30 dias inicia na conclusão.</p>
                  }
                </div>
                <div class="flex items-center gap-2">
                  @if (refillBlock(); as reason) {
                    <app-tooltip [text]="reason" label="Por que a reposição está indisponível?" />
                  }
                  <button type="button" class="btn-ghost" [disabled]="!!refillBlock()" (click)="refillOpen.set(true)">
                    <app-icon name="refresh" class="h-4 w-4" [class.animate-spin]="o.status === 'refilling'" />
                    {{ o.status === 'refilling' ? 'Reposição em andamento' : 'Solicitar reposição (refill)' }}
                  </button>
                </div>
              </footer>
            </article>

            <app-modal [open]="refillOpen()" title="Solicitar reposição" (closed)="refillOpen.set(false)">
              <p class="text-sm leading-relaxed text-ink-muted">
                Vamos verificar a contagem atual de <span class="font-mono text-ink">{{ o.serviceType === 'followers' ? '@' + o.targetHandle : 'sua publicação' }}</span>
                e repor automaticamente qualquer queda em relação às {{ o.amount | number }} unidades entregues.
              </p>
              <ul class="mt-4 space-y-2 text-sm text-ink-muted">
                <li class="flex gap-2"><app-icon name="check" class="h-4 w-4 text-success" /> Sem custo durante a garantia</li>
                <li class="flex gap-2"><app-icon name="check" class="h-4 w-4 text-success" /> Mantenha o perfil público</li>
              </ul>
              <div class="mt-6 flex gap-3">
                <button type="button" class="btn-ghost flex-1" (click)="refillOpen.set(false)" [disabled]="refilling()">Cancelar</button>
                <button type="button" class="btn-primary flex-1" (click)="confirmRefill(o.id)" [disabled]="refilling()">
                  @if (refilling()) { <app-icon name="loader" class="h-4 w-4 animate-spin" /> } Confirmar reposição
                </button>
              </div>
            </app-modal>
          }
        }
      }
    </section>
  `,
})
export class TrackingPage {
  private readonly orders = inject(MockOrderService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  /** Vinculado automaticamente a `:orderId` (withComponentInputBinding). */
  readonly orderId = input<string>();

  protected readonly search = this.fb.group({ query: ['', [Validators.required, Validators.maxLength(254)]] });
  protected readonly searching = signal(false);
  protected readonly searchError = signal<string | null>(null);
  protected readonly results = signal<Order[] | null>(null);

  protected readonly loadState = signal<LoadState>('idle');
  private readonly loadedId = signal<string | null>(null);
  /** Leitura viva do store: a timeline avança sozinha durante a simulação. */
  protected readonly order = computed(() => {
    const id = this.loadedId();
    return id ? this.orders.watch(id)() : undefined;
  });
  protected readonly refillBlock = computed(() => {
    const o = this.order();
    return o ? this.orders.refillBlockReason(o) : null;
  });

  protected readonly refillOpen = signal(false);
  protected readonly refilling = signal(false);

  constructor() {
    toObservable(this.orderId)
      .pipe(
        tap((id) => {
          this.loadedId.set(null);
          this.loadState.set(id ? 'loading' : 'idle');
          if (id) {
            this.results.set(null);
            this.search.controls.query.setValue(id.toUpperCase());
          }
        }),
        switchMap((id) =>
          id
            ? this.orders.getOrderStatus(id).pipe(
                map((o) => o.id),
                catchError(() => of(null)),
              )
            : of(undefined),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((id) => {
        if (id === undefined) return;
        this.loadedId.set(id);
        this.loadState.set(id ? 'ready' : 'not_found');
      });
  }

  protected submit(): void {
    this.searchError.set(null);
    const raw = stripUnsafe(this.search.controls.query.value).replace(/\s+/g, '');
    if (!raw) {
      this.search.markAllAsTouched();
      this.searchError.set('Informe o código do pedido ou e-mail.');
      return;
    }
    const code = raw.toUpperCase();
    if (ORDER_CODE.test(code)) {
      this.router.navigate(['/rastreio', code]);
      return;
    }
    const email = raw.toLowerCase();
    if (!STRICT_EMAIL.test(email)) {
      this.searchError.set('Formato inválido. Use PG-XXXXXX ou um e-mail válido.');
      return;
    }
    this.searching.set(true);
    this.loadState.set('idle');
    this.orders.findOrders(email).subscribe((list) => {
      this.results.set(list);
      this.searching.set(false);
    });
  }

  protected fillDemo(): void {
    this.router.navigate(['/rastreio', 'PG-DEMO02']);
  }

  protected confirmRefill(orderId: string): void {
    this.refilling.set(true);
    this.orders.requestRefill(orderId).subscribe({
      next: () => {
        this.refilling.set(false);
        this.refillOpen.set(false);
        this.toast.success('Reposição solicitada! Acompanhe o status nesta página.');
      },
      error: (err: Error) => {
        this.refilling.set(false);
        this.refillOpen.set(false);
        this.toast.error(err.message);
      },
    });
  }

  protected serviceLabel(o: Order): string {
    return SERVICE_LABEL[o.serviceType].toLowerCase();
  }

  protected platformLabel(o: Order): string {
    return PLATFORM_LABEL[o.platform];
  }
}
