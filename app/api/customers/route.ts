import { NextRequest, NextResponse } from 'next/server';
import { loadDB, saveDB } from '@/lib/store';
import { companyFromRequest } from '@/lib/session';
import { todayISO, uid } from '@/lib/security';

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const db = loadDB();
  const companyId = companyFromRequest(req);
  const now = todayISO();
  db.customers.push({
    id: uid('cus'),
    company_id: companyId,
    name: String(form.get('name') || '').slice(0, 120),
    email: String(form.get('email') || '').toLowerCase().slice(0, 160),
    phone: String(form.get('phone') || '').slice(0, 40) || undefined,
    consent_marketing: form.get('consent_marketing') === '1',
    consent_date: form.get('consent_marketing') === '1' ? now : null,
    notes: '',
    created_at: now
  });
  saveDB(db);
  return NextResponse.redirect(new URL('/clienti', req.url), 303);
}
