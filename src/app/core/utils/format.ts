/** Formata horas em um rótulo amigável ("~6 horas", "~3 dias"). */
export function formatDuration(hours: number): string {
  if (hours < 1) return 'menos de 1 hora';
  if (hours < 24) {
    const h = Math.ceil(hours);
    return `~${h} ${h === 1 ? 'hora' : 'horas'}`;
  }
  const d = Math.ceil(hours / 24);
  return `~${d} ${d === 1 ? 'dia' : 'dias'}`;
}

export function compactNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

/** Hash determinístico simples (FNV-1a 32 bits). */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** PRNG determinístico (mulberry32) para mocks estáveis. */
export function seededRandom(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomId(prefix: string, length = 6): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return prefix + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}
