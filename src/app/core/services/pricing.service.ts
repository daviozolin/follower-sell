import { Injectable } from '@angular/core';
import { DeliveryEstimate, DeliveryMode, Platform, Quote, ServiceLimits, ServiceType } from '../models';
import { formatDuration } from '../utils/format';

/** Preço base por 1.000 unidades (BRL) — tabela de mock. */
const PRICE_PER_THOUSAND: Record<Platform, Record<ServiceType, number>> = {
  instagram: { followers: 39.9, likes: 14.9, views: 4.9 },
  tiktok: { followers: 44.9, likes: 12.9, views: 2.9 },
};

/** Velocidade do modo one-shot (unidades/hora). */
const ONESHOT_RATE_PER_HOUR: Record<ServiceType, number> = {
  followers: 450,
  likes: 1500,
  views: 6000,
};

const LIMITS: Record<ServiceType, ServiceLimits> = {
  followers: { min: 100, max: 20_000, step: 50 },
  likes: { min: 50, max: 20_000, step: 50 },
  views: { min: 500, max: 200_000, step: 500 },
};

const VOLUME_DISCOUNTS: ReadonlyArray<{ from: number; pct: number }> = [
  { from: 10_000, pct: 20 },
  { from: 5_000, pct: 15 },
  { from: 2_500, pct: 10 },
];

/**
 * Drip-feed é o plano premium: a entrega é fracionada e agendada em lotes ao
 * longo de dias (mais orquestração, monitoramento contínuo e menor risco).
 */
const DRIP_PREMIUM_PCT = 35;

/** Sugestões de ritmo diário no modo drip-feed. */
const DRIP_PRESETS: Record<ServiceType, number[]> = {
  followers: [100, 250, 500, 1000],
  likes: [250, 500, 1000, 2500],
  views: [1000, 5000, 10000, 25000],
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Regras de preço e prazo. Puras e síncronas para serem usadas dentro de `computed()`.
 * Na integração real, esta tabela viria do painel SMM / backend.
 */
@Injectable({ providedIn: 'root' })
export class PricingService {
  limits(service: ServiceType): ServiceLimits {
    return LIMITS[service];
  }

  dripPresets(service: ServiceType): number[] {
    return DRIP_PRESETS[service];
  }

  defaultDripRate(service: ServiceType, amount: number): number {
    const presets = DRIP_PRESETS[service];
    // Ritmo que conclua em ~5 dias, arredondado para o preset mais próximo.
    const target = amount / 5;
    return presets.reduce((best, p) => (Math.abs(p - target) < Math.abs(best - target) ? p : best), presets[0]);
  }

  clampAmount(service: ServiceType, amount: number): number {
    const { min, max, step } = LIMITS[service];
    if (!Number.isFinite(amount)) return min;
    const stepped = Math.round(amount / step) * step;
    return Math.min(max, Math.max(min, stepped));
  }

  quote(platform: Platform, service: ServiceType, amount: number, mode: DeliveryMode, unitsPerDay?: number | null): Quote {
    const unitPricePerThousand = PRICE_PER_THOUSAND[platform][service];
    const subtotal = round2((amount / 1000) * unitPricePerThousand);
    const discountPct = VOLUME_DISCOUNTS.find((d) => amount >= d.from)?.pct ?? 0;
    const discount = round2(subtotal * (discountPct / 100));
    const dripPremium = mode === 'drip' ? round2((subtotal - discount) * (DRIP_PREMIUM_PCT / 100)) : 0;
    const total = Math.max(4.9, round2(subtotal - discount + dripPremium));

    return {
      amount,
      unitPricePerThousand,
      subtotal,
      discountPct,
      discount,
      dripPremium,
      total,
      estimate: this.estimate(service, amount, mode, unitsPerDay ?? this.defaultDripRate(service, amount)),
    };
  }

  estimate(service: ServiceType, amount: number, mode: DeliveryMode, unitsPerDay: number): DeliveryEstimate {
    if (mode === 'oneshot') {
      const hours = amount / ONESHOT_RATE_PER_HOUR[service];
      return { hours, label: formatDuration(hours), startsIn: 'até 15 min' };
    }
    const hours = (amount / Math.max(1, unitsPerDay)) * 24;
    return { hours, label: formatDuration(hours), startsIn: 'até 1 hora' };
  }

  get dripPremiumPct(): number {
    return DRIP_PREMIUM_PCT;
  }
}
