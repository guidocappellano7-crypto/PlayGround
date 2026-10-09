import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/store';
import { companyFromRequest } from '@/lib/session';
import { dedupKey, eur, todayISO, uid } from '@/lib/security';
import { draftMessageText } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const quote_id = String(form.get('quote_id') || '');
  const kind = (String(form.get('kind') || 'reminder') as 'initial' | 'reminder' | 'last_call');
  const db = loadDB();
  const companyId = companyFromRequest(req);
  const q = db.quotes.find((x) => x.id === quote_id && x.company_id === companyId);
  if (!q) return NextResponse.json({ error: 'preventivo non trovato' }, { status: 404 });
  const customer = db.customers.find((c) => c.id === q.customer_id)!;
  const company = db.companies.find((c) => c.id === companyId)!;

  // Idempotenza bozze: una sola bozza stesso tipo/giorno
  const key = dedupKey([q.id, kind, new Date().toISOString().slice(0, 10)]);
  if (db.messages.some((m) => m.dedup_key === key)) {
    return NextResponse.redirect(new URL(`/preventivi/${q.id}`, req.url), 303);
  }

  const d = await draftMessageText({
    companyName: company.name,
    customerName: customer.name,
    quoteTitle: q.title,
    amount: eur(q.amount),
    kind
  });
  db.messages.push({
    id: uid('msg'),
    company_id: companyId,
    quote_id: q.id,
    channel: 'email',
    to_email: customer.email,
    subject: d.subject,
    body: d.body,
    status: 'draft',
    ai_generated: d.ai,
    dedup_key: key,
    created_at: todayISO()
  });
  db.events.push({ id: uid('ev'), company_id: companyId, quote_id: q.id, type: 'draft_created', detail: `Bozza ${kind}${d.ai ? ' (AI)' : ' (template)'}`, created_at: todayISO() });
  saveDB(db);
  return NextResponse.redirect(new URL(`/preventivi/${q.id}`, req.url), 303);
}
