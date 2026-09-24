import { Injectable, Signal, computed, effect, signal } from '@angular/core';
import { Observable, Subscription, interval, map, switchMap, takeWhile, tap, timer } from 'rxjs';
import { CreateOrderRequest, Order, PaymentMethod } from '../models';
import { randomId } from '../utils/format';
import { readJson, writeJson } from '../utils/storage';

const STORAGE_KEY = 'pg.orders.v1';
const GUARANTEE_DAYS = 30;
const DAY_MS = 86_400_000;

/** Latências simuladas (ms). */
const LATENCY = { create: 650, read: 450, refill: 900 } as const;
/** Velocidade da simulação (acelerada para demo). */
const SIM = { processingMs: 3000, tickMs: 1200, refillMs: 6000 } as const;

export type OrderErrorCode = 'not_found' | 'refill_not_allowed' | 'invalid_state';

export class OrderError extends Error {
  constructor(readonly code: OrderErrorCode, message: string) {
    super(message);
    this.name = 'OrderError';
  }
}

/**
 * Mock do backend de pedidos.
 *
 * - O estado vive em um `signal` (fonte da verdade) e é persistido no localStorage,
 *   então o rastreio funciona após recarregar a página.
 * - Os métodos públicos retornam `Observable` com `delay()` para imitar HTTP; troque o corpo
 *   por `HttpClient` sem mudar a assinatura.
 * - `watch(id)` devolve um `Signal` vivo: a tela reage à simulação de entrega em tempo real.
 */
@Injectable({ providedIn: 'root' })
export class MockOrderService {
  private readonly store = signal<Record<string, Order>>(readJson(STORAGE_KEY, {}) || {});
  private readonly simulations = new Map<string, Subscription>();

  readonly orders = computed(() =>
    Object.values(this.store()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

  constructor() {
    if (Object.keys(this.store()).length === 0) this.seedDemoOrders();
    effect(() => writeJson(STORAGE_KEY, this.store()));
    // Retoma simulações interrompidas por um reload.
    for (const order of Object.values(this.store())) {
      if (order.status === 'processing' || order.status === 'delivering') this.runDelivery(order.id);
      if (order.status === 'refilling') this.runRefill(order.id);
    }
  }

  // ---------------------------------------------------------------------------
  // API pública (mesma forma que a futura API HTTP)
  // ---------------------------------------------------------------------------

  createOrder(request: CreateOrderRequest): Observable<Order> {
    return timer(LATENCY.create).pipe(
      map(() => {
        const order: Order = {
          ...request,
          id: this.nextId(),
          status: 'pending',
          createdAt: new Date().toISOString(),
          paidAt: null,
          deliveryStartedAt: null,
          completedAt: null,
          delivered: 0,
          refillCount: 0,
          guaranteeUntil: null,
        };
        this.put(order);
        return order;
      }),
    );
  }

  getOrderStatus(orderId: string): Observable<Order> {
    return timer(LATENCY.read).pipe(map(() => this.require(orderId)));
  }

  /** Busca por código do pedido ou e-mail do cliente. */
  findOrders(query: string): Observable<Order[]> {
    const q = query.trim().toLowerCase();
    return timer(LATENCY.read).pipe(
      map(() => this.orders().filter((o) => o.id.toLowerCase() === q || o.customerEmail === q)),
    );
  }

  requestRefill(orderId: string): Observable<Order> {
    return timer(LATENCY.refill).pipe(
      map(() => {
        const order = this.require(orderId);
        const reason = this.refillBlockReason(order);
        if (reason) throw new OrderError('refill_not_allowed', reason);
        const updated = this.patch(order.id, { status: 'refilling' });
        this.runRefill(order.id);
        return updated;
      }),
    );
  }

  /** Signal reativo de um pedido — atualiza sozinho durante a simulação. */
  watch(orderId: string): Signal<Order | undefined> {
    const id = orderId.toUpperCase();
    return computed(() => this.store()[id]);
  }

  /** Motivo pelo qual a reposição não é permitida (ou `null` se permitida). */
  refillBlockReason(order: Order): string | null {
    if (order.status === 'refilling') return 'Já existe uma reposição em andamento para este pedido.';
    if (order.status !== 'completed') return 'A reposição fica disponível após a conclusão da entrega.';
    if (order.guaranteeUntil && new Date(order.guaranteeUntil).getTime() < Date.now()) {
      return 'O período de garantia de 30 dias deste pedido expirou.';
    }
    return null;
  }

  /** Troca o método de um pedido ainda não pago (ex.: cartão recusado → Pix). */
  updatePaymentMethod(orderId: string, method: PaymentMethod): Observable<Order> {
    return timer(LATENCY.read).pipe(
      map(() => {
        const order = this.require(orderId);
        if (order.status !== 'pending') throw new OrderError('invalid_state', 'Este pedido já foi pago.');
        return this.patch(order.id, { paymentMethod: method });
      }),
    );
  }

  /** Chamado pelo serviço de pagamento quando a cobrança é confirmada. */
  confirmPayment(orderId: string): void {
    const order = this.require(orderId);
    if (order.status !== 'pending') return;
    this.patch(order.id, { status: 'processing', paidAt: new Date().toISOString() });
    this.runDelivery(order.id);
  }

  // ---------------------------------------------------------------------------
  // Simulação
  // ---------------------------------------------------------------------------

  private runDelivery(orderId: string): void {
    this.simulations.get(orderId)?.unsubscribe();
    const order = this.store()[orderId];
    const ticks = order.deliverySpeed.mode === 'turbo' ? 8 : 16;
    const chunk = Math.ceil(order.amount / ticks);

    const sub = timer(order.status === 'processing' ? SIM.processingMs : 0)
      .pipe(
        tap(() => {
          if (this.store()[orderId].status === 'processing') {
            this.patch(orderId, { status: 'delivering', deliveryStartedAt: new Date().toISOString() });
          }
        }),
        switchMap(() => interval(SIM.tickMs)),
        takeWhile(() => this.store()[orderId]?.status === 'delivering'),
      )
      .subscribe(() => {
        const current = this.store()[orderId];
        const delivered = Math.min(current.amount, current.delivered + chunk);
        if (delivered < current.amount) {
          this.patch(orderId, { delivered });
          return;
        }
        const now = new Date();
        this.patch(orderId, {
          delivered,
          status: 'completed',
          completedAt: now.toISOString(),
          guaranteeUntil: new Date(now.getTime() + GUARANTEE_DAYS * DAY_MS).toISOString(),
        });
      });
    this.simulations.set(orderId, sub);
  }

  private runRefill(orderId: string): void {
    this.simulations.get(orderId)?.unsubscribe();
    const sub = timer(SIM.refillMs).subscribe(() => {
      const current = this.store()[orderId];
      this.patch(orderId, { status: 'completed', refillCount: current.refillCount + 1 });
    });
    this.simulations.set(orderId, sub);
  }

  // ---------------------------------------------------------------------------
  // Helpers de estado
  // ---------------------------------------------------------------------------

  private require(orderId: string): Order {
    const order = this.store()[orderId.trim().toUpperCase()];
    if (!order) throw new OrderError('not_found', 'Não encontramos um pedido com esse código.');
    return order;
  }

  private put(order: Order): void {
    this.store.update((s) => ({ ...s, [order.id]: order }));
  }

  private patch(orderId: string, changes: Partial<Order>): Order {
    const updated = { ...this.store()[orderId], ...changes };
    this.put(updated);
    return updated;
  }

  private nextId(): string {
    let id: string;
    do id = randomId('PG-');
    while (this.store()[id]);
    return id;
  }

  private seedDemoOrders(): void {
    const now = Date.now();
    const iso = (offsetMs: number) => new Date(now - offsetMs).toISOString();
    const demo: Order[] = [
      {
        id: 'PG-DEMO01',
        customerEmail: 'demo@pulsegrowth.app',
        targetHandle: 'studio.aurora',
        platform: 'instagram',
        serviceType: 'followers',
        packageId: 'instagram-followers-1000',
        amount: 1000,
        totalPrice: 39.9,
        status: 'completed',
        deliverySpeed: { mode: 'drip', unitsPerDay: 250 },
        paymentMethod: 'pix',
        createdAt: iso(6 * DAY_MS),
        paidAt: iso(6 * DAY_MS - 120_000),
        deliveryStartedAt: iso(6 * DAY_MS - 600_000),
        completedAt: iso(2 * DAY_MS),
        delivered: 1000,
        refillCount: 0,
        guaranteeUntil: new Date(now + 28 * DAY_MS).toISOString(),
      },
      {
        id: 'PG-DEMO02',
        customerEmail: 'demo@pulsegrowth.app',
        targetHandle: 'https://www.tiktok.com/@cafe.lab/video/7312345678901234567',
        platform: 'tiktok',
        serviceType: 'views',
        packageId: 'tiktok-views-10000',
        amount: 10000,
        totalPrice: 27.84,
        status: 'delivering',
        deliverySpeed: { mode: 'turbo', unitsPerDay: null },
        paymentMethod: 'credit_card',
        createdAt: iso(1_800_000),
        paidAt: iso(1_700_000),
        deliveryStartedAt: iso(1_500_000),
        completedAt: null,
        delivered: 3750,
        refillCount: 0,
        guaranteeUntil: null,
      },
    ];
    this.store.set(Object.fromEntries(demo.map((o) => [o.id, o])));
  }
}
