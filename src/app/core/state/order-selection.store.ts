import { Injectable, computed, inject, signal } from '@angular/core';
import { DeliveryMode, Package, Platform, ServiceType } from '../models';
import { PackageCatalogService } from '../services/package-catalog.service';
import { PricingService } from '../services/pricing.service';

export interface SelectionSnapshot {
  platform: Platform;
  serviceType: ServiceType;
  amount: number;
  mode: DeliveryMode;
  unitsPerDay: number;
  packageId: string;
}

/**
 * Estado da seleção do usuário (plataforma → serviço → quantidade → velocidade).
 * Compartilhado entre Home (seletor, pacotes, calculadora) e Checkout.
 * Tudo derivado via `computed` — nenhum valor duplicado.
 */
@Injectable({ providedIn: 'root' })
export class OrderSelectionStore {
  private readonly pricing = inject(PricingService);
  private readonly catalog = inject(PackageCatalogService);

  readonly platform = signal<Platform>('instagram');
  readonly serviceType = signal<ServiceType>('followers');
  readonly amount = signal(1000);
  readonly mode = signal<DeliveryMode>('drip');
  /** `null` = usar o ritmo sugerido para a quantidade atual. */
  private readonly customRate = signal<number | null>(null);

  readonly limits = computed(() => this.pricing.limits(this.serviceType()));
  readonly packages = computed(() => this.catalog.packagesFor(this.platform(), this.serviceType()));
  readonly dripPresets = computed(() => this.pricing.dripPresets(this.serviceType()));
  readonly unitsPerDay = computed(
    () => this.customRate() ?? this.pricing.defaultDripRate(this.serviceType(), this.amount()),
  );

  readonly selectedPackage = computed<Package | undefined>(() =>
    this.packages().find((p) => p.amount === this.amount()),
  );

  readonly quote = computed(() =>
    this.pricing.quote(this.platform(), this.serviceType(), this.amount(), this.mode(), this.unitsPerDay()),
  );

  readonly snapshot = computed<SelectionSnapshot>(() => ({
    platform: this.platform(),
    serviceType: this.serviceType(),
    amount: this.amount(),
    mode: this.mode(),
    unitsPerDay: this.unitsPerDay(),
    packageId: this.selectedPackage()?.id ?? `custom-${this.platform()}-${this.serviceType()}-${this.amount()}`,
  }));

  setPlatform(platform: Platform): void {
    this.platform.set(platform);
  }

  setServiceType(service: ServiceType): void {
    if (service === this.serviceType()) return;
    this.serviceType.set(service);
    // Ao trocar de serviço, volta para o pacote "popular" desse serviço.
    const popular = this.packages().find((p) => p.isPopular) ?? this.packages()[0];
    this.amount.set(popular.amount);
    this.customRate.set(null);
  }

  setAmount(amount: number): void {
    this.amount.set(this.pricing.clampAmount(this.serviceType(), amount));
  }

  setMode(mode: DeliveryMode): void {
    this.mode.set(mode);
  }

  setUnitsPerDay(rate: number | null): void {
    this.customRate.set(rate);
  }

  selectPackage(pkg: Package): void {
    this.platform.set(pkg.platform);
    this.serviceType.set(pkg.serviceType);
    this.amount.set(pkg.amount);
    this.customRate.set(null);
  }

  /** Restaura a seleção a partir de query params (link compartilhável do checkout). */
  hydrate(params: Partial<Record<'platform' | 'service' | 'amount' | 'mode', string | null>>): void {
    if (params.platform === 'instagram' || params.platform === 'tiktok') this.platform.set(params.platform);
    if (params.service === 'followers' || params.service === 'likes' || params.service === 'views') {
      this.serviceType.set(params.service);
    }
    if (params.mode === 'oneshot' || params.mode === 'drip') this.mode.set(params.mode);
    if (params.amount) this.setAmount(Number(params.amount));
  }

  queryParams(): Record<string, string | number> {
    return { platform: this.platform(), service: this.serviceType(), amount: this.amount(), mode: this.mode() };
  }
}
