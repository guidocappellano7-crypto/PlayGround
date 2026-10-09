import { loadDB } from '@/lib/store';
import { requireCompanyId } from '@/lib/session';
import { eur } from '@/lib/security';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function Dettaglio({ params }: { params: { id: string } }) {
  const db = loadDB();
  // Multi-tenancy: filtro sempre per company_id della sessione
  const companyId = requireCompanyId();
  const q = db.quotes.find((x) => x.id === params.id && x.company_id === companyId);
  if (!q) return notFound();
  const customer = db.customers.find((c) => c.id === q.customer_id);
  const company = db.companies.find((c) => c.id === companyId)!;
  const msgs = db.messages.filter((m) => m.quote_id === q.id);
  const events = db.events.filter((e) => e.quote_id === q.id);
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3002';
  const link = `${base}/q/${q.public_token}`;

  return (
    <div className="space-y-4">
      <Link href="/preventivi" className="text-sm font-semibold underline">← Tutti i preventivi</Link>
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold">{q.title}</h1>
            <p className="text-sm text-slate-600">{customer?.name} · {customer?.email} · <strong>{eur(q.amount)}</strong></p>
            <p className="mt-1 text-xs text-slate-500">Stato: <span className="badge bg-slate-100">{q.status}</span> · scade {new Date(q.valid_until).toLocaleDateString('it-IT')} · ricontattare entro {new Date(q.follow_up_due).toLocaleDateString('it-IT')}</p>
          </div>
          <div className="flex gap-2">
            <Link className="btn-ghost" href={`/q/${q.public_token}`}>Vedi come cliente</Link>
            <Link className="btn-ghost" href={`/api/quotes/${q.id}/pdf`}>Scarica PDF</Link>
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
          <strong>Link sicuro cliente (token 256-bit):</strong>
          <code className="ml-2 break-all font-mono text-xs">{link}</code>
        </div>
        <div className="mt-3 text-sm">
          <strong>Voci:</strong>
          <ul className="list-disc pl-5">
            {q.items.map((it, i) => (
              <li key={i}>{it.desc} — {it.qty} × {eur(it.price)}</li>
            ))}
          </ul>
          <p className="mt-2"><strong>Condizioni:</strong> {q.conditions}</p>
        </div>
        <form className="mt-4 flex flex-wrap gap-2" action={`/api/quotes/${q.id}/status`} method="post">
          <input type="hidden" name="company_id" value={company.id} />
          <button className="btn-ghost" name="status" value="sent" type="submit">Segna inviato</button>
          <button className="btn-ghost" name="status" value="abandoned" type="submit">Segna abbandonato</button>
          <button className="btn-red" name="status" value="expired" type="submit">Segna scaduto</button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-bold">✉️ Messaggi — approvazione umana obbligatoria</h2>
        <p className="mb-3 text-xs text-slate-500">L'AI propone, tu approvi, solo dopo parte l'invio. Mai invii automatici di nuovi prezzi/condizioni.</p>
        {msgs.map((m) => (
          <div key={m.id} className="mb-3 rounded-xl border border-slate-200 p-3 text-sm">
            <div className="flex items-center justify-between">
              <strong>{m.subject}</strong>
              <span className="badge bg-slate-100">{m.status}{m.ai_generated ? ' · AI' : ' · template'}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-slate-700">{m.body}</p>
            <div className="mt-2 flex gap-2">
              {m.status === 'draft' && (
                <form action={`/api/messages/${m.id}/approve`} method="post">
                  <button className="btn-primary" type="submit">Approva testo</button>
                </form>
              )}
              {m.status === 'approved' && (
                <form action={`/api/messages/${m.id}/send`} method="post">
                  <button className="btn-green" type="submit">Invia ora</button>
                </form>
              )}
            </div>
          </div>
        ))}
        {msgs.length === 0 && <p className="text-sm text-slate-500">Nessun messaggio. Creane uno:</p>}
        <form className="mt-3 flex flex-wrap gap-2" action="/api/messages/generate" method="post">
          <input type="hidden" name="quote_id" value={q.id} />
          <button className="btn-ghost" name="kind" value="initial" type="submit">Bozza invio iniziale</button>
          <button className="btn-ghost" name="kind" value="reminder" type="submit">Bozza promemoria</button>
          <button className="btn-ghost" name="kind" value="last_call" type="submit">Bozza ultimo avviso</button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-bold">🕒 Storico decisioni</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {events.map((e) => (
            <li key={e.id}>• <strong>{e.type}</strong> {e.detail || ''} <span className="text-xs text-slate-400">({new Date(e.created_at).toLocaleString('it-IT')})</span></li>
          ))}
          {events.length === 0 && <li className="text-slate-500">Nessun evento.</li>}
        </ul>
      </div>
    </div>
  );
}
