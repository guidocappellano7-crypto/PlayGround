import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/store';
import { hashPassword, newResetToken } from '@/lib/auth';
import { sendEmail } from '@/lib/email';
import { todayISO } from '@/lib/security';

// POST /api/auth/recover — chiede reset. Risposta sempre generica (anti-enumerazione).
// In dev il token viene mostrato nei log server; in prod via email Resend.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const db = loadDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email);
  if (user) {
    const token = newResetToken();
    const exp = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1h
    db.resetTokens.push({ token, user_id: user.id, expires_at: exp, used: false, created_at: todayISO() });
    saveDB(db);
    const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
    const link = `${base}/reset?token=${token}`;
    console.log(`[RECOVER] ${email} -> ${link}`);
    // Se Resend configurato, invia davvero
    if (process.env.RESEND_API_KEY) {
      await sendEmail({
        to: user.email,
        subject: 'Recupero password — Preventivi Smart',
        html: `<p>Ciao ${user.name},</p><p>Per reimpostare la password clicca entro 1 ora:</p><p><a href="${link}">${link}</a></p><p>Se non l'hai chiesto tu, ignora.</p>`,
        dedupKey: `recover:${user.id}:${Date.now()}`
      });
    }
  }
  return NextResponse.redirect(new URL('/recupero?inviato=1', req.url), 303);
}

// POST /api/auth/reset — completa reset con token
export async function PUT(req: NextRequest) {
  const form = await req.formData();
  const token = String(form.get('token') || '').trim();
  const password = String(form.get('password') || '');
  if (!token || password.length < 8) {
    return NextResponse.json({ error: 'Token non valido o password troppo corta (min 8).' }, { status: 400 });
  }
  const db = loadDB();
  const rt = db.resetTokens.find((t) => t.token === token && !t.used);
  if (!rt || new Date(rt.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Link scaduto o non valido. Richiedine uno nuovo.' }, { status: 400 });
  }
  const user = db.users.find((u) => u.id === rt.user_id);
  if (!user) return NextResponse.json({ error: 'Utente non trovato.' }, { status: 400 });
  const { hash, salt } = hashPassword(password);
  user.pass_hash = hash;
  user.pass_salt = salt;
  rt.used = true;
  saveDB(db);
  return NextResponse.redirect(new URL('/login?reset=1', req.url), 303);
}
