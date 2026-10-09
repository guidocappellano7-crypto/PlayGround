import { NextRequest, NextResponse } from 'next/server';
import { loadDB } from '@/lib/store';
import { companyFromRequest } from '@/lib/session';
import { eur } from '@/lib/security';

// PDF semplice e stampabile (HTML -> print-to-PDF). Evita dipendenze pesanti nel monolite.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = loadDB();
  const q = db.quotes.find((x) => x.id === params.id && x.company_id === companyFromRequest(_req));
  if (!q) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const company = db.companies.find((c) => c.id === q.company_id)!;
  const customer = db.customers.find((c) => c.id === q.customer_id)!;
  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Preventivo ${q.id}</title>
  <style>body{font-family:system-ui,sans-serif;max-width:700px;margin:40px auto;padding:0 20px}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;padding:8px;text-align:left}.tot{font-size:20px;font-weight:800}@media print{.noprint{display:none}}</style></head><body>
  <div class="noprint"><button onclick="window.print()">🖨️ Stampa / Salva PDF</button> <a href="/preventivi/${q.id}">← Torna</a></div>
  <h1>${company.name}</h1><p>${company.email}</p><hr>
  <h2>${q.title}</h2><p>Cliente: ${customer.name} (${customer.email})<br>Data: ${new Date(q.created_at).toLocaleDateString('it-IT')} · Valido fino al: ${new Date(q.valid_until).toLocaleDateString('it-IT')}</p>
  <table><tr><th>Voce</th><th>Qtà</th><th>Prezzo</th><th>Totale</th></tr>
  ${q.items.map((it) => `<tr><td>${it.desc}</td><td>${it.qty}</td><td>${eur(it.price)}</td><td>${eur(it.qty * it.price)}</td></tr>`).join('')}
  </table><p class="tot">Totale: ${eur(q.amount)}</p><p><strong>Condizioni:</strong> ${q.conditions}</p>
  <p><small>Stato: ${q.status} · Documento generato dal gestionale. Prezzi decisi dall'azienda, non dall'AI.</small></p></body></html>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
