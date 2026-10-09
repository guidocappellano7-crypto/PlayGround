import crypto from 'crypto';

const COOKIE = 'ps_session';
const SECRET = () => process.env.AUTH_SECRET || 'dev-secret-cambia-in-produzione';

export interface SessionData {
  user_id: string;
  company_id: string;
  email: string;
  exp: number;
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, s, 32).toString('hex');
  return { hash, salt: s };
}

export function verifyPassword(password: string, salt: string, hash: string): boolean {
  try {
    const h = crypto.scryptSync(password, salt, 32).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(hash));
  } catch {
    return false;
  }
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', SECRET()).update(payload).digest('hex');
}

export function createSession(s: Omit<SessionData, 'exp'>, days = 7): string {
  const data: SessionData = { ...s, exp: Date.now() + days * 86400000 };
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function readSession(token?: string | null): SessionData | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  if (sig !== sign(payload)) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionData;
    if (d.exp < Date.now()) return null;
    return d;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string): string {
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 86400};`;
}

export function clearSessionCookie(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0;`;
}

export const SESSION_COOKIE = COOKIE;

export function newResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
