import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/store';
import { createSession, hashPassword, sessionCookie, verifyPassword } from '@/lib/auth';
import { todayISO, uid } from '@/lib/security';

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

// POST /api/auth/login — form: email, password
export async function POST(req: NextRequest) {
  const ct = req.headers.get('content-type') || '';
  let email = '';
  let password = '';
  if (ct.includes('application/json')) {
    const j = await req.json();
    email = String(j.email || '');
    password = String(j.password || '');
  } else {
    const form = await req.formData();
    email = String(form.get('email') || '');
    password = String(form.get('password') || '');
  }
  email = email.trim().toLowerCase();
  if (!email || !password) return bad('Email e password obbligatorie.');

  const db = loadDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email);
  // Anti-enumerazione: stesso tempo di risposta, messaggio generico
  if (!user || !verifyPassword(password, user.pass_salt, user.pass_hash)) {
    return bad('Credenziali non valide.', 401);
  }

  const token = createSession({ user_id: user.id, company_id: user.company_id, email: user.email });
  const res = NextResponse.redirect(new URL('/', req.url), 303);
  res.headers.set('Set-Cookie', sessionCookie(token));
  return res;
}

// Registrazione chiusa in demo? No: signup crea NUOVA azienda (modello SaaS vendibile).
export async function PUT(req: NextRequest) {
  const form = await req.formData();
  const name = String(form.get('name') || '').slice(0, 80).trim();
  const company = String(form.get('company') || '').slice(0, 120).trim();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const password = String(form.get('password') || '');
  if (!name || !company || !email || password.length < 8) {
    return bad('Compila tutti i campi. Password minimo 8 caratteri.');
  }
  const db = loadDB();
  if (db.users.some((u) => u.email.toLowerCase() === email)) {
    return bad('Email già registrata. Prova il login o il recupero password.', 409);
  }
  const companyId = uid('co');
  const now = todayISO();
  db.companies.push({ id: companyId, name: company, email });
  const { hash, salt } = hashPassword(password);
  const userId = uid('usr');
  db.users.push({ id: userId, company_id: companyId, name, email, pass_hash: hash, pass_salt: salt, created_at: now });
  saveDB(db);
  const token = createSession({ user_id: userId, company_id: companyId, email });
  const res = NextResponse.redirect(new URL('/', req.url), 303);
  res.headers.set('Set-Cookie', sessionCookie(token));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  const { clearSessionCookie } = await import('@/lib/auth');
  res.headers.set('Set-Cookie', clearSessionCookie());
  return res;
}
