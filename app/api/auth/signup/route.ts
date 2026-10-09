import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/store';
import { createSession, hashPassword, sessionCookie } from '@/lib/auth';
import { todayISO, uid } from '@/lib/security';

// POST /api/auth/signup — crea nuova azienda + primo utente (modello SaaS)
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const name = String(form.get('name') || '').slice(0, 80).trim();
  const company = String(form.get('company') || '').slice(0, 120).trim();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const password = String(form.get('password') || '');
  if (!name || !company || !email || password.length < 8) {
    return NextResponse.json({ error: 'Compila tutti i campi. Password minimo 8 caratteri.' }, { status: 400 });
  }
  const db = loadDB();
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return NextResponse.json({ error: 'Email già registrata.' }, { status: 409 });
  }
  const companyId = uid('co');
  db.companies.push({ id: companyId, name: company, email });
  const { hash, salt } = hashPassword(password);
  const userId = uid('usr');
  db.users.push({ id: userId, company_id: companyId, name, email, pass_hash: hash, pass_salt: salt, created_at: todayISO() });
  saveDB(db);
  const res = NextResponse.redirect(new URL('/', req.url), 303);
  res.headers.set('Set-Cookie', sessionCookie(createSession({ user_id: userId, company_id: companyId, email })));
  return res;
}
