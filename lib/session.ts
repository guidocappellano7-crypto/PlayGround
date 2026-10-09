import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { SESSION_COOKIE, readSession, type SessionData } from './auth';
import { DEMO_COMPANY_ID } from './types';

/** Company della sessione; fallback demo solo se nessuna sessione (per transizione). */
export function getSession(): SessionData | null {
  try {
    const token = cookies().get(SESSION_COOKIE)?.value;
    return readSession(token);
  } catch {
    return null;
  }
}

/** In produzione con Supabase Auth: sostituire readSession con verify JWT Supabase. */
export function requireCompanyId(): string {
  const s = getSession();
  return s?.company_id || DEMO_COMPANY_ID;
}

/** Per le API route: legge la sessione dal cookie della request. */
export function sessionFromRequest(req: NextRequest): SessionData | null {
  return readSession(req.cookies.get(SESSION_COOKIE)?.value);
}

export function companyFromRequest(req: NextRequest): string {
  return sessionFromRequest(req)?.company_id || DEMO_COMPANY_ID;
}
