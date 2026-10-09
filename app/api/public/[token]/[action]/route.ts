import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/store';
import { isExpired, rateLimit, todayISO, uid } from '@/lib/security';

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
}

function guard(req: NextRequest) {
  if (!rateLimit('pub:' + clientIp(req))) {
    return NextResponse.json({ error: 'troppe richieste, riprova tra un minuto' }, { status: 429 });
  }
  return null;
}

export async function POST(req: NextRequest, { params }: { params: { token: string; action: string } }) {
  const blocked = guard(req);
  if (blocked) return blocked;
  const action = params.action;
  const db = loadDB();
  const q = db.quotes.find((x) => x.public_token === params.token);
  if (!q) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (isExpired(q.valid_until)) {
    q.status = 'expired';
    saveDB(db);
    return NextResponse.redirect(new URL(`/q/${q.public_token}?scaduto=1`, req.url), 303);
  }
  if (['accepted', 'declined'].includes(q.status)) {
    return NextResponse.redirect(new URL(`/q/${q.public_token}`, req.url), 303);
  }

  const now = todayISO();
  if (action === 'accept') {
    q.status = 'accepted';
    q.decided_at = now;
    q.decision_note = 'Accettato dal cliente via link.';
    q.last_opened_at = now;
    q.updated_at = now;
    db.events.push({ id: uid('ev'), company_id: q.company_id, quote_id: q.id, type: 'accepted', detail: 'Cliente ha cliccato Accetto.', created_at: now });
  } else if (action === 'decline') {
    q.status = 'declined';
    q.decided_at = now;
    q.decision_note = 'Cliente non interessato via link.';
    q.updated_at = now;
    db.events.push({ id: uid('ev'), company_id: q.company_id, quote_id: q.id, type: 'declined', detail: 'Cliente ha cliccato Non sono interessato.', created_at: now });
  } else if (action === 'question') {
    const form = await req.formData();
    const question = String(form.get('question') || '').slice(0, 2000);
    const contact = String(form.get('contact') || '').slice(0, 200);
    if (!question.trim()) return NextResponse.json({ error: 'domanda vuota' }, { status: 400 });
    if (q.status === 'sent') q.status = 'viewed';
    q.last_opened_at = now;
    q.updated_at = now;
    db.events.push({ id: uid('ev'), company_id: q.company_id, quote_id: q.id, type: 'question', detail: `${question} (ricontatto: ${contact || 'via email'})`, created_at: now });
  }
  saveDB(db);
  return NextResponse.redirect(new URL(`/q/${q.public_token}`, req.url), 303);
}
