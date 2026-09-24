export type PixChargeStatus = 'awaiting' | 'paid' | 'expired';

export interface PixCharge {
  id: string;
  orderId: string;
  amount: number;
  /** Código "copia e cola" (BR Code / EMV). */
  brCode: string;
  expiresAt: string;
  status: PixChargeStatus;
}

export interface CardPaymentRequest {
  orderId: string;
  holderName: string;
  /** Somente dígitos. Nunca persistido — apenas os 4 últimos são mantidos. */
  number: string;
  expiry: string;
  cvv: string;
  installments: number;
}

export interface CardPaymentResult {
  approved: boolean;
  last4: string;
  brand: string;
  message: string;
}
