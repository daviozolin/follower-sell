import { Platform } from './platform.model';

export interface ProfilePreview {
  platform: Platform;
  handle: string;
  displayName: string;
  isPrivate: boolean;
  followers: number;
  posts: number;
  /** Cor de fundo gerada para o avatar (sem imagem externa). */
  avatarHue: number;
}
