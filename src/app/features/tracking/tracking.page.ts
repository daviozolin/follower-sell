import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { BUNDLE_PACE_LABEL, Order, PLATFORM_LABEL, SERVICE_LABEL } from '../../core/models';
import { BundleService } from '../../core/services/bundle.service';
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
  templateUrl: './tracking.page.html',
})
export class TrackingPage {
  private readonly orders = inject(MockOrderService);
  private readonly bundles = inject(BundleService);
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
    return o.serviceType === 'combo' ? 'seguidores + curtidas + visualizações' : SERVICE_LABEL[o.serviceType].toLowerCase();
  }

  protected productTitle(o: Order): string {
    if (o.bundle) return `Combo ${this.bundles.tierById(o.bundle.tierId).name}`;
    return `${o.amount.toLocaleString('pt-BR')} ${this.serviceLabel(o)}`;
  }

  protected deliveryLabel(o: Order): string {
    if (o.bundle) return `${BUNDLE_PACE_LABEL[o.bundle.pace]} · ${o.bundle.durationDays} dias`;
    return o.deliverySpeed.mode === 'oneshot' ? 'Rápida' : `Gradual · ${o.deliverySpeed.unitsPerDay?.toLocaleString('pt-BR')}/dia`;
  }

  protected platformLabel(o: Order): string {
    return PLATFORM_LABEL[o.platform];
  }
}
