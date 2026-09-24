import { DeliveryMode, Platform, ServiceType } from './platform.model';

export type OrderStatus = 'pending' | 'processing' | 'delivering' | 'completed' | 'refilling';
export type PaymentMethod = 'pix' | 'credit_card';

export interface DeliverySpeed {
  mode: DeliveryMode;
  /** Somente no modo drip: unidades entregues por dia. */
  unitsPerDay: number | null;
}

export interface Order {
  id: string;
  customerEmail: string;
  /** @usuario (seguidores) ou URL da publicação (curtidas/visualizações). */
  targetHandle: string;
  platform: Platform;
  serviceType: ServiceType;
  /** Id do pacote de catálogo, ou `custom-*` quando veio da calculadora. */
  packageId: string;
  amount: number;
  totalPrice: number;
  status: OrderStatus;
  deliverySpeed: DeliverySpeed;
  paymentMethod: PaymentMethod;
  createdAt: string;
  paidAt: string | null;
  deliveryStartedAt: string | null;
  completedAt: string | null;
  /** Unidades já entregues (progresso). */
  delivered: number;
  refillCount: number;
  /** Data limite (ISO) da garantia de reposição. */
  guaranteeUntil: string | null;
}

export interface CreateOrderRequest {
  customerEmail: string;
  targetHandle: string;
  platform: Platform;
  serviceType: ServiceType;
  packageId: string;
  amount: number;
  totalPrice: number;
  deliverySpeed: DeliverySpeed;
  paymentMethod: PaymentMethod;
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Aguardando pagamento',
  processing: 'Pagamento aprovado',
  delivering: 'Em entrega',
  completed: 'Concluído',
  refilling: 'Reposição em andamento',
};
