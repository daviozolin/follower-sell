import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { Platform } from '../models';
import { digitsOnly, sanitizeEmail, sanitizeHandle, sanitizeUrl } from './sanitize';

/**
 * Instagram: 1–30 caracteres, letras/números/ponto/underscore,
 * sem ponto no início/fim e sem pontos consecutivos.
 */
export const INSTAGRAM_HANDLE = /^(?!\.)(?!.*\.\.)(?!.*\.$)[a-z0-9._]{1,30}$/;

/** TikTok: 2–24 caracteres, letras/números/ponto/underscore, sem ponto final. */
export const TIKTOK_HANDLE = /^(?!.*\.$)[a-z0-9._]{2,24}$/;

export const INSTAGRAM_POST_URL =
  /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\/[A-Za-z0-9_-]{5,}\/?(\?.*)?$/;

export const TIKTOK_POST_URL =
  /^https?:\/\/((www|m)\.)?tiktok\.com\/@[A-Za-z0-9._]{2,24}\/(video|photo)\/\d{8,25}\/?(\?.*)?$|^https?:\/\/vm\.tiktok\.com\/[A-Za-z0-9]{5,}\/?$/;

export function handlePattern(platform: Platform): RegExp {
  return platform === 'instagram' ? INSTAGRAM_HANDLE : TIKTOK_HANDLE;
}

export function socialHandleValidator(platform: () => Platform): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = sanitizeHandle(control.value ?? '');
    if (!value) return null; // `required` cuida do vazio
    return handlePattern(platform()).test(value) ? null : { handle: { platform: platform() } };
  };
}

export function postUrlValidator(platform: () => Platform): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const value = sanitizeUrl(control.value ?? '');
    if (!value) return null;
    const pattern = platform() === 'instagram' ? INSTAGRAM_POST_URL : TIKTOK_POST_URL;
    return pattern.test(value) ? null : { postUrl: { platform: platform() } };
  };
}

/** Algoritmo de Luhn para número de cartão. */
export function luhnValidator(control: AbstractControl<string>): ValidationErrors | null {
  const digits = digitsOnly(control.value ?? '');
  if (!digits) return null;
  if (digits.length < 13 || digits.length > 19) return { cardNumber: true };
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0 ? null : { cardNumber: true };
}

/** MM/AA, não expirado. */
export function cardExpiryValidator(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value ?? '';
  if (!value) return null;
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value);
  if (!match) return { expiry: true };
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  return endOfMonth >= new Date() ? null : { expiry: true };
}

export const STRICT_EMAIL = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

/** Valida o e-mail já normalizado (trim + minúsculas), sem punir espaços acidentais. */
export function emailValidator(control: AbstractControl<string>): ValidationErrors | null {
  const value = sanitizeEmail(control.value ?? '');
  if (!value) return null;
  return value.length <= 254 && STRICT_EMAIL.test(value) ? null : { email: true };
}
