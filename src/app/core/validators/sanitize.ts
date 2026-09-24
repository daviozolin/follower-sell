/** Remove caracteres de controle, marcação e espaços invisíveis. */
export function stripUnsafe(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\u0000-\u001F\u007F​-‍﻿]/g, '')
    .replace(/[<>"'`]/g, '')
    .trim();
}

/** Normaliza um @usuario: sem espaços, sem "@" inicial, minúsculo. */
export function sanitizeHandle(value: string): string {
  return stripUnsafe(value).replace(/\s+/g, '').replace(/^@+/, '').toLowerCase();
}

export function sanitizeUrl(value: string): string {
  return stripUnsafe(value).replace(/\s+/g, '');
}

export function sanitizeEmail(value: string): string {
  return stripUnsafe(value).replace(/\s+/g, '').toLowerCase();
}

export function digitsOnly(value: string): string {
  return value.replace(/\D+/g, '');
}
