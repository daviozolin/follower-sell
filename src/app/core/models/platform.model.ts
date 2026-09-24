export type Platform = 'instagram' | 'tiktok';
export type ServiceType = 'followers' | 'likes' | 'views';
export type DeliveryMode = 'turbo' | 'drip';

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

/** Seguidores miram um perfil; curtidas/visualizações miram uma publicação. */
export const SERVICE_TARGET: Record<ServiceType, 'profile' | 'post'> = {
  followers: 'profile',
  likes: 'post',
  views: 'post',
};
