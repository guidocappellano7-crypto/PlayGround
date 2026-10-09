import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/store';
import { companyFromRequest } from '@/lib/session';
import { todayISO, uid } from '@/lib/security';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = loadDB();
  const companyId = companyFromRequest(req);
  const m = db.messages.find((x) => x.id === params.id && x.company_id === companyId);
  if (!m) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (m.status !== 'draft') return NextResponse.json({ error: 'solo bozze' }, { status: 400 });
  m.status = 'approved';
  m.approved_at = todayISO();
  db.events.push({ id: uid('ev'), company_id: companyId, quote_id: m.quote_id, type: 'message_approved', detail: `Approvato da operatore: ${m.subject}`, created_at: todayISO() });
  saveDB(db);
  const back = req.headers.get('referer') || `/preventivi/${m.quote_id}`;
  // Torna al preventivo per il passo "Invia"
  return NextResponse.redirect(new URL(`/preventivi/${m.quote_id}`, req.url), 303);
}
