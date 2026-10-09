import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/store';
import { QuoteStatus } from '@/lib/types';
import { companyFromRequest } from '@/lib/session';
import { todayISO, uid } from '@/lib/security';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const form = await req.formData();
  const status = String(form.get('status') || '') as QuoteStatus;
  if (!['sent', 'abandoned', 'expired', 'viewed', 'draft'].includes(status)) {
    return NextResponse.json({ error: 'stato non valido' }, { status: 400 });
  }
  const db = loadDB();
  const companyId = companyFromRequest(req);
  const q = db.quotes.find((x) => x.id === params.id && x.company_id === companyId);
  if (!q) return NextResponse.json({ error: 'not found' }, { status: 404 });
  q.status = status;
  q.updated_at = todayISO();
  db.events.push({ id: uid('ev'), company_id: companyId, quote_id: q.id, type: status, detail: 'Aggiornato da operatore.', created_at: todayISO() });
  saveDB(db);
  return NextResponse.redirect(new URL(`/preventivi/${q.id}`, req.url), 303);
}
