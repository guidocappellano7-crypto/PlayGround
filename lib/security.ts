import crypto from 'crypto';

/** Token pubblico non prevedibile: 256 bit -> 64 char hex. */
export function newPublicToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/** Chiave idempotente per promemoria/invii: stesso input => stessa chiave. */
export function dedupKey(parts: (string | number)[]): string {
  return parts.join(':');
}

/** Scadenza di default: +14 giorni. Follow-up default: +3 giorni. */
export function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function todayISO(): string {
  return new Date().toISOString();
}

export function isExpired(validUntilISO: string): boolean {
  return new Date(validUntilISO).getTime() < Date.now();
}

export function eur(n: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(n);
}

export function uid(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

// Rate-limit in-memory per IP (per il portale pubblico).
const hits = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, max = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || now > cur.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  cur.count += 1;
  return cur.count <= max;
}
