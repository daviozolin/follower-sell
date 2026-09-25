import { Platform, ServiceType } from './platform.model';

export interface Package {
  id: string;
  platform: Platform;
  serviceType: ServiceType;
  amount: number;
  /** Preço base em BRL (entrega one-shot; o drip-feed soma o adicional premium). */
  price: number;
  isPopular: boolean;
  /** Prazo estimado legível (ex.: "Até 2 dias"). */
  deliveryTime: string;
  features: string[];
}

export interface ServiceLimits {
  min: number;
  max: number;
  step: number;
}
