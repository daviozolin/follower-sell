import { Injectable, inject } from '@angular/core';
import { Observable, delay, of } from 'rxjs';
import { Package, Platform, ServiceType } from '../models';
import { PricingService } from './pricing.service';

const AMOUNTS: Record<ServiceType, number[]> = {
  followers: [500, 1000, 2500, 5000],
  likes: [500, 1000, 2500, 5000],
  views: [2500, 5000, 10000, 25000],
};

const BASE_FEATURES = ['Garantia 30 dias', 'Reposição automática', '100% seguro (sem senha)'];

/** Catálogo mockado. Troque `list()` por uma chamada HTTP ao seu painel SMM. */
@Injectable({ providedIn: 'root' })
export class PackageCatalogService {
  private readonly pricing = inject(PricingService);

  /** Síncrono para uso em `computed()` — o catálogo é derivado da tabela de preços. */
  packagesFor(platform: Platform, service: ServiceType): Package[] {
    return AMOUNTS[service].map((amount, index) => {
      const quote = this.pricing.quote(platform, service, amount, 'oneshot');
      return {
        id: `${platform}-${service}-${amount}`,
        platform,
        serviceType: service,
        amount,
        price: quote.total,
        isPopular: index === 1,
        deliveryTime: quote.estimate.label,
        features: index >= 2 ? [...BASE_FEATURES, 'Suporte prioritário'] : BASE_FEATURES,
      };
    });
  }

  list(platform: Platform, service: ServiceType): Observable<Package[]> {
    return of(this.packagesFor(platform, service)).pipe(delay(250));
  }

  findById(id: string): Package | undefined {
    const [platform, service] = id.split('-') as [Platform, ServiceType];
    return this.packagesFor(platform, service).find((p) => p.id === id);
  }
}
