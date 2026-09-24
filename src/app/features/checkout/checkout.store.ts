import { Injectable, computed, inject, signal } from '@angular/core';
import { Order, PaymentMethod, PixCharge, ProfilePreview, SERVICE_TARGET } from '../../core/models';
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

/**
 * Estado do fluxo de checkout — escopo do componente (`providers` da página),
 * então é descartado ao sair do checkout.
 */
@Injectable()
export class CheckoutStore {
  readonly selection = inject(OrderSelectionStore);

  readonly step = signal<CheckoutStep>('profile');
  readonly profile = signal<ProfileData | null>(null);
  readonly paymentMethod = signal<PaymentMethod>('pix');
  readonly order = signal<Order | null>(null);
  readonly pixCharge = signal<PixCharge | null>(null);

  readonly targetKind = computed(() => SERVICE_TARGET[this.selection.serviceType()]);
  readonly stepIndex = computed(() => {
    const i = CHECKOUT_STEPS.findIndex((s) => s.id === this.step());
    return i === -1 ? CHECKOUT_STEPS.length : i;
  });
  /** Depois de gerar o pedido, a seleção fica congelada. */
  readonly locked = computed(() => this.order() !== null);

  goTo(step: CheckoutStep): void {
    this.step.set(step);
    queueMicrotask(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  saveProfile(data: ProfileData): void {
    this.profile.set(data);
    this.goTo('delivery');
  }
}
