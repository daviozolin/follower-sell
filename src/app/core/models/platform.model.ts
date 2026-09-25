export type Platform = 'instagram' | 'tiktok';
export type ServiceType = 'followers' | 'likes' | 'views';
/** Produto do pedido: um serviço avulso ou o combo orgânico (seguidores + curtidas + views). */
export type ProductType = ServiceType | 'combo';
/** `oneshot` = entrega rápida (tudo de uma vez) · `drip` = entrega gradual (um pouco por dia, +35%). */
export type DeliveryMode = 'oneshot' | 'drip';

export const PLATFORMS: readonly Platform[] = ['instagram', 'tiktok'];
export const SERVICE_TYPES: readonly ServiceType[] = ['followers', 'likes', 'views'];

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
};

export const SERVICE_LABEL: Record<ServiceType, string> = {
  followers: 'Seguidores',
  likes: 'Curtidas',
  views: 'Visualizações',
};

export const DELIVERY_MODE_LABEL: Record<DeliveryMode, string> = {
  oneshot: 'Entrega rápida',
  drip: 'Entrega gradual',
};

export const PRODUCT_LABEL: Record<ProductType, string> = {
  ...SERVICE_LABEL,
  combo: 'Combo orgânico',
};

/** Seguidores miram um perfil; curtidas/visualizações miram uma publicação. */
export const SERVICE_TARGET: Record<ServiceType, 'profile' | 'post'> = {
  followers: 'profile',
  likes: 'post',
  views: 'post',
};
