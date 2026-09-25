import { Injectable, inject } from '@angular/core';
import {
  BundleComponent,
  BundleDay,
  BundlePace,
  BundlePlan,
  BundleTier,
  BundleTierId,
  OrderBundle,
  Platform,
} from '../models';
import { hashString, seededRandom } from '../utils/format';
import { PricingService } from './pricing.service';

export const BUNDLE_TIERS: readonly BundleTier[] = [
  { id: 'start', name: 'Essencial', tagline: 'Para tirar o perfil do zero', minFollowers: 0, maxFollowers: 2_000, referenceBase: 800 },
  { id: 'growth', name: 'Crescimento', tagline: 'Para ganhar tração', minFollowers: 2_000, maxFollowers: 10_000, referenceBase: 5_000 },
  { id: 'pro', name: 'Destaque', tagline: 'Para criadores em ascensão', minFollowers: 10_000, maxFollowers: 50_000, referenceBase: 25_000 },
  { id: 'scale', name: 'Autoridade', tagline: 'Para marcas e perfis grandes', minFollowers: 50_000, maxFollowers: null, referenceBase: 100_000 },
];

/**
 * Proporções de engajamento "orgânico" em relação à base projetada.
 * IG: curtidas ≈ 3,5% da base por post; views de Reels ≈ 25% da base.
 * TikTok: views ≈ 1,2× a base por vídeo; curtidas ≈ 8% das views.
 */
const ENGAGEMENT: Record<Platform, { likePosts: number; viewPosts: number; likesPerPost: (base: number) => number; viewsPerPost: (base: number) => number }> = {
  instagram: { likePosts: 6, viewPosts: 4, likesPerPost: (b) => b * 0.035, viewsPerPost: (b) => b * 0.25 },
  tiktok: { likePosts: 4, viewPosts: 4, likesPerPost: (b) => b * 1.2 * 0.08, viewsPerPost: (b) => b * 1.2 },
};

const MIN_PER_POST = { likes: 30, views: 300 } as const;
const COMBO_DISCOUNT_PCT = 18;
const PACE: Record<BundlePace, { duration: number; price: number }> = {
  intense: { duration: 0.6, price: -7 },
  natural: { duration: 1, price: 0 },
  gentle: { duration: 1.5, price: 8 },
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Arredonda para números "de vitrine" (50, 100, 500…). */
export function roundNice(n: number): number {
  const step = n < 1_000 ? 50 : n < 10_000 ? 100 : 500;
  return Math.max(step, Math.round(n / step) * step);
}

/**
 * Crescimento seguro em ~1 ciclo: perfis pequenos toleram % maiores;
 * perfis grandes precisam de incrementos proporcionalmente menores.
 */
function safeGrowth(base: number): number {
  if (base < 1_000) return Math.max(300, base);
  if (base < 10_000) return base * 0.4;
  if (base < 50_000) return base * 0.2;
  if (base < 200_000) return base * 0.1;
  return base * 0.05;
}

/** Distribui `total` em inteiros proporcionais aos pesos (maior resto). */
function distribute(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const raw = weights.map((w) => (w / sum) * total);
  const out = raw.map(Math.floor);
  let rest = total - out.reduce((a, b) => a + b, 0);
  raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
    .forEach(({ i }) => rest-- > 0 && out[i]++);
  return out;
}

/**
 * Monta combos seguidores + curtidas + views proporcionais ao tamanho do perfil.
 * Tudo síncrono e determinístico para ser usado em `computed()`.
 */
@Injectable({ providedIn: 'root' })
export class BundleService {
  private readonly pricing = inject(PricingService);

  readonly tiers = BUNDLE_TIERS;
  readonly discountPct = COMBO_DISCOUNT_PCT;

  tierFor(baseFollowers: number): BundleTier {
    return BUNDLE_TIERS.find((t) => t.maxFollowers === null || baseFollowers < t.maxFollowers) ?? BUNDLE_TIERS[0];
  }

  tierById(id: BundleTierId): BundleTier {
    return BUNDLE_TIERS.find((t) => t.id === id) ?? BUNDLE_TIERS[0];
  }

  plan(platform: Platform, baseFollowers: number, pace: BundlePace = 'natural'): BundlePlan {
    const base = Math.max(0, Math.round(baseFollowers));
    const tier = this.tierFor(base);
    const followers = Math.min(20_000, roundNice(safeGrowth(base)));
    const projected = base + followers;

    const eng = ENGAGEMENT[platform];
    const likesPerPost = roundNice(Math.max(MIN_PER_POST.likes, eng.likesPerPost(projected)));
    const viewsPerPost = roundNice(Math.max(MIN_PER_POST.views, eng.viewsPerPost(projected)));
    const likes = likesPerPost * eng.likePosts;
    const views = viewsPerPost * eng.viewPosts;

    const naturalDays = Math.min(30, Math.max(5, Math.ceil(followers / Math.max(50, base * 0.02))));
    const durationDays = Math.min(45, Math.max(3, Math.round(naturalDays * PACE[pace].duration)));

    const component = (service: BundleComponent['service'], amount: number, posts: number | null): BundleComponent => ({
      service,
      amount,
      posts,
      perPost: posts ? amount / posts : null,
      standalonePrice: this.pricing.quote(platform, service, amount, 'drip').total,
    });
    const components = [
      component('followers', followers, null),
      component('likes', likes, eng.likePosts),
      component('views', views, eng.viewPosts),
    ];

    const standaloneTotal = round2(components.reduce((s, c) => s + c.standalonePrice, 0));
    const paceAdjustmentPct = PACE[pace].price;
    const total = round2(standaloneTotal * (1 - COMBO_DISCOUNT_PCT / 100) * (1 + paceAdjustmentPct / 100));

    return {
      platform,
      baseFollowers: base,
      tier,
      pace,
      components,
      followers,
      likes,
      views,
      durationDays,
      projectedFollowers: projected,
      growthPct: base > 0 ? Math.round((followers / base) * 100) : 100,
      standaloneTotal,
      discountPct: COMBO_DISCOUNT_PCT,
      paceAdjustmentPct,
      total,
      savings: round2(standaloneTotal - total),
      schedule: this.schedule(platform, base, durationDays, followers, likes, views, eng.likePosts, eng.viewPosts),
    };
  }

  /**
   * Cronograma diário que imita crescimento orgânico: seguidores com variação
   * suave dia a dia; curtidas e views em picos nos "dias de post" que decaem nos dias seguintes.
   */
  private schedule(
    platform: Platform,
    base: number,
    days: number,
    followers: number,
    likes: number,
    views: number,
    likePosts: number,
    viewPosts: number,
  ): BundleDay[] {
    const rand = seededRandom(hashString(`${platform}:${base}:${days}`));
    const followerWeights = Array.from({ length: days }, (_, d) => 0.75 + rand() * 0.5 + 0.25 * Math.sin(d / 1.7));

    const burstWeights = (posts: number) => {
      const w = new Array<number>(days).fill(0.04);
      const decay = [1, 0.45, 0.2];
      for (let p = 0; p < posts; p++) {
        const day = Math.min(days - 1, Math.floor(((p + 0.3) * days) / posts));
        decay.forEach((k, j) => day + j < days && (w[day + j] += k * (0.85 + rand() * 0.3)));
      }
      return w;
    };

    const f = distribute(followers, followerWeights);
    const l = distribute(likes, burstWeights(likePosts));
    const v = distribute(views, burstWeights(viewPosts));
    return f.map((followersDay, d) => ({ day: d + 1, followers: followersDay, likes: l[d], views: v[d] }));
  }

  toOrderBundle(plan: BundlePlan): OrderBundle {
    return {
      tierId: plan.tier.id,
      baseFollowers: plan.baseFollowers,
      pace: plan.pace,
      durationDays: plan.durationDays,
      components: plan.components.map((c) => ({ service: c.service, amount: c.amount, delivered: 0, posts: c.posts })),
    };
  }
}
