import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/store';
import { companyFromRequest } from '@/lib/session';
import { dedupKey, isoDaysFromNow, newPublicToken, todayISO, uid } from '@/lib/security';
import { draftMessageText } from '@/lib/ai';
import { eur } from '@/lib/security';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const db = loadDB();
  const companyId = companyFromRequest(req);
  const now = todayISO();
  const customer_id = String(form.get('customer_id') || '');
  const customer = db.customers.find((c) => c.id === customer_id && c.company_id === companyId);
  if (!customer) return NextResponse.json({ error: 'cliente non trovato' }, { status: 400 });

  const title = String(form.get('title') || 'Preventivo').slice(0, 160);
  const amount = Math.max(1, Number(form.get('amount') || 0));
  const validDays = Math.min(90, Math.max(1, Number(form.get('valid_days') || 14)));
  const conditions = String(form.get('conditions') || '').slice(0, 1000);
  const rawItems = String(form.get('items') || '');
  const items = rawItems
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((l) => {
      const [desc = 'Voce', qty = '1', price = '0'] = l.split('|').map((s) => s.trim());
      return { desc: desc.slice(0, 120), qty: Math.max(1, Number(qty) || 1), price: Math.max(0, Number(price) || 0) };
    });

  const id = uid('quo');
  db.quotes.push({
    id,
    company_id: companyId,
    customer_id,
    title,
    amount, // deciso dall'umano — l'AI non lo toccherà mai
    items: items.length ? items : [{ desc: title, qty: 1, price: amount }],
    conditions,
    status: 'draft',
    valid_until: isoDaysFromNow(validDays),
    follow_up_due: isoDaysFromNow(3),
    public_token: newPublicToken(),
    last_opened_at: null,
    decided_at: null,
    decision_note: null,
    created_at: now,
    updated_at: now
  });

  // Bozza iniziale (AI o template) — resta in draft finché un umano approva
  const company = db.companies.find((c) => c.id === companyId)!;
  const draft = await draftMessageText({
    companyName: company.name,
    customerName: customer.name,
    quoteTitle: title,
    amount: eur(amount),
    kind: 'initial'
  });
  db.messages.push({
    id: uid('msg'),
    company_id: companyId,
    quote_id: id,
    channel: 'email',
    to_email: customer.email,
    subject: draft.subject,
    body: draft.body,
    status: 'draft',
    ai_generated: draft.ai,
    dedup_key: dedupKey([id, 'initial', new Date().toISOString().slice(0, 10)]),
    created_at: now
  });
  db.events.push({ id: uid('ev'), company_id: companyId, quote_id: id, type: 'created', detail: `Creato da operatore: ${title} ${eur(amount)}`, created_at: now });
  saveDB(db);
  return NextResponse.redirect(new URL(`/preventivi/${id}`, req.url), 303);
}
