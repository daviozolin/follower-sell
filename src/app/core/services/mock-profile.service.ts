import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { Platform, ProfilePreview } from '../models';
import { hashString, seededRandom } from '../utils/format';

/**
 * Simula a busca pública do perfil (sem login, sem senha).
 * Convenções de teste:
 *  - handle contendo "privado" ou "private" → perfil privado
 *  - handle contendo "naoexiste" ou "notfound" → 404
 */
@Injectable({ providedIn: 'root' })
export class MockProfileService {
  lookup(platform: Platform, handle: string): Observable<ProfilePreview> {
    if (/naoexiste|notfound/.test(handle)) {
      return throwError(() => new Error('Perfil não encontrado. Confira o @usuario.')).pipe(delay(700));
    }
    const rand = seededRandom(hashString(`${platform}:${handle}`));
    const displayName = handle
      .split(/[._]/)
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(' ');

    return of<ProfilePreview>({
      platform,
      handle,
      displayName: displayName || handle,
      isPrivate: /privado|private/.test(handle),
      followers: Math.floor(200 + rand() * 48_000),
      posts: Math.floor(4 + rand() * 600),
      avatarHue: Math.floor(rand() * 360),
    }).pipe(delay(700 + Math.floor(rand() * 500)));
  }
}
