import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/store';
import { companyFromRequest } from '@/lib/session';
import { eur, todayISO, uid } from '@/lib/security';
import { quoteEmailHtml, sendEmail } from '@/lib/email';

// Invio IDEMPOTENTE: se dedup_key già inviata -> skip, mai doppio invio.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = loadDB();
  const companyId = companyFromRequest(req);
  const m = db.messages.find((x) => x.id === params.id && x.company_id === companyId);
  if (!m) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (m.status !== 'approved') return NextResponse.json({ error: 'approva prima il testo' }, { status: 400 });

  // Idempotenza: dedup già inviata -> skip, mai doppio invio.
  if (db.sendLogs.some((l) => l.dedup_key === m.dedup_key && (l.result === 'sent' || l.result === 'dev_logged'))) {
    db.sendLogs.push({ id: uid('log'), company_id: companyId, quote_id: m.quote_id, message_id: m.id, kind: 'manual', to_email: m.to_email, dedup_key: m.dedup_key, result: 'skipped_duplicate', created_at: todayISO() });
    saveDB(db);
    return NextResponse.redirect(new URL(`/preventivi/${m.quote_id}`, req.url), 303);
  }

  const q = db.quotes.find((x) => x.id === m.quote_id)!;
  const company = db.companies.find((c) => c.id === companyId)!;
  const customer = db.customers.find((c) => c.id === q.customer_id)!;
  const base = process.env.NEXT_PUBLIC_BASE_URL || new URL(req.url).origin;
  const link = `${base}/q/${q.public_token}`;

  const r = await sendEmail({
    to: m.to_email,
    subject: m.subject,
    html: quoteEmailHtml({ companyName: company.name, customerName: customer.name, quoteTitle: q.title, amount: eur(q.amount), link, body: m.body }),
    dedupKey: m.dedup_key
  });

  const now = todayISO();
  if (r.ok) {
    m.status = 'sent';
    m.sent_at = now;
    q.status = q.status === 'draft' ? 'sent' : q.status;
    q.updated_at = now;
    db.sendLogs.push({ id: uid('log'), company_id: companyId, quote_id: q.id, message_id: m.id, kind: 'manual', to_email: m.to_email, dedup_key: m.dedup_key, result: r.provider === 'dev-log' ? 'dev_logged' : 'sent', created_at: now });
    db.events.push({ id: uid('ev'), company_id: companyId, quote_id: q.id, type: 'message_sent', detail: `Inviato a ${m.to_email} via ${r.provider}`, created_at: now });
  } else {
    m.status = 'failed';
    m.error = r.error;
    db.sendLogs.push({ id: uid('log'), company_id: companyId, quote_id: q.id, message_id: m.id, kind: 'manual', to_email: m.to_email, dedup_key: m.dedup_key, result: 'failed', created_at: now });
  }
  saveDB(db);
  return NextResponse.redirect(new URL(`/preventivi/${m.quote_id}`, req.url), 303);
}
