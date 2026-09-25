import { Injectable, computed, inject, signal } from '@angular/core';
import {
  BundlePace,
  BundlePlan,
  CreateOrderRequest,
  Order,
  PaymentMethod,
  PixCharge,
  Platform,
  ProfilePreview,
  SERVICE_TARGET,
} from '../../core/models';
import { BundleService } from '../../core/services/bundle.service';
import { OrderSelectionStore } from '../../core/state/order-selection.store';

export type CheckoutStep = 'profile' | 'delivery' | 'payment' | 'pix' | 'success';

export const CHECKOUT_STEPS: ReadonlyArray<{ id: CheckoutStep; label: string }> = [
  { id: 'profile', label: 'Perfil' },
  { id: 'delivery', label: 'Entrega' },
  { id: 'payment', label: 'Pagamento' },
];

export interface ProfileData {
  target: string;
  email: string;
  preview: ProfilePreview | null;
}

interface ComboInput {
  platform: Platform;
  base: number;
  pace: BundlePace;
}

/**
 * Estado do fluxo de checkout — escopo do componente (`providers` da página),
 * então é descartado ao sair do checkout.
 *
 * Suporta dois produtos: serviço avulso (vem do `OrderSelectionStore`) e
 * combo orgânico (plano calculado pelo `BundleService`).
 */
@Injectable()
export class CheckoutStore {
  readonly selection = inject(OrderSelectionStore);
  private readonly bundles = inject(BundleService);

  readonly step = signal<CheckoutStep>('profile');
  readonly profile = signal<ProfileData | null>(null);
  readonly paymentMethod = signal<PaymentMethod>('pix');
  readonly order = signal<Order | null>(null);
  readonly pixCharge = signal<PixCharge | null>(null);

  private readonly comboInput = signal<ComboInput | null>(null);
  readonly bundle = computed<BundlePlan | null>(() => {
    const c = this.comboInput();
    return c ? this.bundles.plan(c.platform, c.base, c.pace) : null;
  });
  readonly isCombo = computed(() => this.comboInput() !== null);

  readonly platform = computed(() => this.comboInput()?.platform ?? this.selection.platform());
  /** Combo sempre mira o perfil (curtidas/views vão para as publicações recentes). */
  readonly targetKind = computed(() => (this.isCombo() ? 'profile' : SERVICE_TARGET[this.selection.serviceType()]));
  readonly total = computed(() => this.bundle()?.total ?? this.selection.quote().total);

  readonly stepIndex = computed(() => {
    const i = CHECKOUT_STEPS.findIndex((s) => s.id === this.step());
    return i === -1 ? CHECKOUT_STEPS.length : i;
  });
  /** Depois de gerar o pedido, a seleção fica congelada. */
  readonly locked = computed(() => this.order() !== null);

  startCombo(platform: Platform, base: number, pace: BundlePace): void {
    this.comboInput.set({ platform, base: Math.max(0, Math.round(base)), pace });
  }

  setComboBase(base: number): void {
    this.comboInput.update((c) => (c ? { ...c, base: Math.max(0, Math.round(base)) } : c));
  }

  setComboPace(pace: BundlePace): void {
    this.comboInput.update((c) => (c ? { ...c, pace } : c));
  }

  goTo(step: CheckoutStep): void {
    this.step.set(step);
    queueMicrotask(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  saveProfile(data: ProfileData): void {
    this.profile.set(data);
    this.goTo('delivery');
  }

  /** Monta o payload do pedido a partir do produto atual. */
  orderRequest(method: PaymentMethod): CreateOrderRequest {
    const profile = this.profile()!;
    const plan = this.bundle();
    if (plan) {
      return {
        customerEmail: profile.email,
        targetHandle: profile.target,
        platform: plan.platform,
        serviceType: 'combo',
        packageId: `combo-${plan.tier.id}`,
        amount: plan.followers,
        totalPrice: plan.total,
        deliverySpeed: { mode: 'drip', unitsPerDay: null },
        paymentMethod: method,
        bundle: this.bundles.toOrderBundle(plan),
      };
    }
    const snap = this.selection.snapshot();
    return {
      customerEmail: profile.email,
      targetHandle: profile.target,
      platform: snap.platform,
      serviceType: snap.serviceType,
      packageId: snap.packageId,
      amount: snap.amount,
      totalPrice: this.selection.quote().total,
      deliverySpeed: { mode: snap.mode, unitsPerDay: snap.mode === 'drip' ? snap.unitsPerDay : null },
      paymentMethod: method,
      bundle: null,
    };
  }
}
