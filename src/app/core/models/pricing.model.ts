export interface Quote {
  amount: number;
  unitPricePerThousand: number;
  subtotal: number;
  discountPct: number;
  discount: number;
  /** Adicional do drip-feed (entrega gradual premium). */
  dripPremium: number;
  total: number;
  estimate: DeliveryEstimate;
}

export interface DeliveryEstimate {
  hours: number;
  label: string;
  /** Tempo até o início da entrega (ex.: "até 15 min"). */
  startsIn: string;
}
