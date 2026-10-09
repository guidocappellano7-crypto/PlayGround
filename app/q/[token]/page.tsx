import { loadDB } from '@/lib/store';
import { eur, isExpired } from '@/lib/security';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function PublicQuote({ params }: { params: { token: string } }) {
  const db = loadDB();
  // Lookup SOLO per token: niente enumeration di ID, niente dati di altri clienti.
  const q = db.quotes.find((x) => x.public_token === params.token);
  if (!q) return notFound();
  const company = db.companies.find((c) => c.id === q.company_id)!;
  const customer = db.customers.find((c) => c.id === q.customer_id)!;
  const expired = isExpired(q.valid_until);
  const decided = ['accepted', 'declined'].includes(q.status);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card">
        <div className="text-xs font-semibold uppercase text-slate-500">{company.name}</div>
        <h1 className="mt-1 text-2xl font-extrabold">{q.title}</h1>
        <p className="text-sm text-slate-600">Preparato per {customer.name} · scade il {new Date(q.valid_until).toLocaleDateString('it-IT')}</p>
        <div className="mt-3 rounded-2xl bg-slate-50 p-4">
          {q.items.map((it, i) => (
            <div key={i} className="flex justify-between border-b border-slate-200 py-2 text-sm last:border-0">
              <span>{it.desc} <span className="text-slate-400">×{it.qty}</span></span>
              <strong>{eur(it.qty * it.price)}</strong>
            </div>
          ))}
          <div className="flex justify-between pt-3 text-lg font-extrabold">
            <span>Totale</span><span>{eur(q.amount)}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500"><strong>Condizioni:</strong> {q.conditions}</p>
        {expired && <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">Questo preventivo è scaduto. Contatta l'azienda per aggiornarlo.</div>}
        {decided && <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">Hai già comunicato la tua decisione ({q.status}). Grazie!</div>}
      </div>

      {!decided && !expired && (
        <div className="card space-y-3">
          <h2 className="font-bold">La tua decisione</h2>
          <div className="grid gap-2">
            <form action={`/api/public/${q.public_token}/accept`} method="post">
              <button className="btn-green w-full" type="submit">✅ Accetto il preventivo</button>
            </form>
            <form action={`/api/public/${q.public_token}/decline`} method="post">
              <button className="btn-red w-full" type="submit">Non sono interessato</button>
            </form>
          </div>
          <form action={`/api/public/${q.public_token}/question`} method="post" className="space-y-2 border-t border-slate-100 pt-3">
            <label className="label">Ho una domanda</label>
            <textarea name="question" required rows={3} className="input" placeholder="Es. potete fare in due rate? I tempi di consegna?" />
            <input name="contact" className="input" placeholder="Come ricontattarti (facoltativo)" />
            <button className="btn-primary w-full" type="submit">Invia domanda</button>
          </form>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Inviando accetti di essere ricontattato su questo preventivo (misure precontrattuali, art. 6.1.b GDPR).
            Nessun marketing senza consenso separato. Il link è personale: non condividerlo.
          </p>
        </div>
      )}
    </div>
  );
}
