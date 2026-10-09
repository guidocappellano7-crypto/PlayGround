import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/store';
import { hashPassword } from '@/lib/auth';

// POST /api/auth/reset — completa il reset con token (valido 1h, monouso)
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const token = String(form.get('token') || '').trim();
  const password = String(form.get('password') || '');
  if (!token || password.length < 8) {
    return NextResponse.json({ error: 'Token non valido o password troppo corta (min 8).' }, { status: 400 });
  }
  const db = loadDB();
  const rt = db.resetTokens.find((t) => t.token === token && !t.used);
  if (!rt || new Date(rt.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Link scaduto o non valido. Richiedine uno nuovo da /recupero.' }, { status: 400 });
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
