import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/store';
import { dedupKey, isExpired, todayISO, uid } from '@/lib/security';
import { draftMessageText } from '@/lib/ai';
import { eur } from '@/lib/security';

// Job pianificato IDEMPOTENTE (tutte le aziende): crea bozze promemoria (non invia da solo).
// Proteggere con CRON_SECRET in produzione. Doppia esecuzione stessa giornata = nessun duplicato.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') || '';
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = loadDB();
  const now = todayISO();
  const today = now.slice(0, 10);
  let created = 0;
  let markedExpired = 0;

  for (const q of db.quotes) {
    const cid = q.company_id;
    if (isExpired(q.valid_until) && ['sent', 'viewed', 'draft'].includes(q.status)) {
      q.status = 'expired';
      q.updated_at = now;
      markedExpired++;
      db.events.push({ id: uid('ev'), company_id: cid, quote_id: q.id, type: 'expired', detail: 'Scaduto automaticamente.', created_at: now });
      continue;
    }
    if (!['sent', 'viewed'].includes(q.status)) continue;
    if (new Date(q.follow_up_due).getTime() > Date.now()) continue;

    const key = dedupKey([q.id, 'reminder', today]);
    if (db.messages.some((m) => m.dedup_key === key)) continue; // idempotente

    const customer = db.customers.find((c) => c.id === q.customer_id);
    const company = db.companies.find((c) => c.id === cid)!;
    if (!customer) continue;
    const ageDays = (Date.now() - new Date(q.created_at).getTime()) / 86400000;
    if (ageDays > 30 && !customer.consent_marketing) {
      q.status = 'abandoned';
      q.updated_at = now;
      db.events.push({ id: uid('ev'), company_id: cid, quote_id: q.id, type: 'abandoned', detail: 'Nessuna risposta dopo 30gg.', created_at: now });
      continue;
    }

    const d = await draftMessageText({
      companyName: company.name,
      customerName: customer.name,
      quoteTitle: q.title,
      amount: eur(q.amount),
      kind: ageDays > 10 ? 'last_call' : 'reminder'
    });
    db.messages.push({
      id: uid('msg'), company_id: cid, quote_id: q.id, channel: 'email',
      to_email: customer.email, subject: d.subject, body: d.body, status: 'draft',
      ai_generated: d.ai, dedup_key: key, created_at: now
    });
    db.events.push({ id: uid('ev'), company_id: cid, quote_id: q.id, type: 'reminder_drafted', detail: 'Bozza promemoria da approvare.', created_at: now });
    created++;
  }

  saveDB(db);

  const ct = req.headers.get('content-type') || '';
  if (req.headers.get('referer') && !ct.includes('application/json')) {
    return NextResponse.redirect(new URL('/', req.url), 303);
  }
  return NextResponse.json({ ok: true, reminders_drafted: created, marked_expired: markedExpired });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
