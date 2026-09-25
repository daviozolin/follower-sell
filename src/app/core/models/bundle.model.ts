import { Platform, ServiceType } from './platform.model';

/** Ritmo do combo: mais curto = mais intenso; mais longo = mais suave (e mais orquestração). */
export type BundlePace = 'intense' | 'natural' | 'gentle';
export type BundleTierId = 'start' | 'growth' | 'pro' | 'scale';

export interface BundleTier {
  id: BundleTierId;
  name: string;
  tagline: string;
  /** Faixa de seguidores atuais para a qual o plano foi calibrado. */
  minFollowers: number;
  maxFollowers: number | null;
  /** Base usada para montar o card fixo do plano. */
  referenceBase: number;
}

export interface BundleComponent {
  service: ServiceType;
  amount: number;
  /** Nº de publicações recentes que recebem a entrega (curtidas/views). */
  posts: number | null;
  perPost: number | null;
  /** Preço se comprado avulso (drip-feed). */
  standalonePrice: number;
}

export interface BundleDay {
  day: number;
  followers: number;
  likes: number;
  views: number;
}

/** Plano calculado para uma base de seguidores específica. */
export interface BundlePlan {
  platform: Platform;
  baseFollowers: number;
  tier: BundleTier;
  pace: BundlePace;
  components: BundleComponent[];
  followers: number;
  likes: number;
  views: number;
  durationDays: number;
  projectedFollowers: number;
  growthPct: number;
  standaloneTotal: number;
  discountPct: number;
  /** Ajuste de preço pelo ritmo (negativo = desconto). */
  paceAdjustmentPct: number;
  total: number;
  savings: number;
  schedule: BundleDay[];
}

/** O que fica gravado no pedido. */
export interface OrderBundle {
  tierId: BundleTierId;
  baseFollowers: number;
  pace: BundlePace;
  durationDays: number;
  components: Array<{ service: ServiceType; amount: number; delivered: number; posts: number | null }>;
}

export const BUNDLE_PACE_LABEL: Record<BundlePace, string> = {
  intense: 'Intenso',
  natural: 'Natural',
  gentle: 'Suave',
};
