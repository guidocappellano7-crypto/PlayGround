import { companyScope, loadDB } from '@/lib/store';
import { requireCompanyId } from '@/lib/session';
import { eur } from '@/lib/security';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Home() {
  const db = loadDB();
  const companyId = requireCompanyId();
  const s = companyScope(db, companyId);
  const company = db.companies.find((c) => c.id === companyId) || db.companies[0];

  const open = s.quotes.filter((q) => ['sent', 'viewed'].includes(q.status));
  const pendingValue = open.reduce((a, q) => a + q.amount, 0);
  const accepted = s.quotes.filter((q) => q.status === 'accepted');
  const declined = s.quotes.filter((q) => q.status === 'declined');
  const acceptedValue = accepted.reduce((a, q) => a + q.amount, 0);
  const total = s.quotes.length;
  const conv = total ? Math.round((accepted.length / total) * 100) : 0;

  const now = Date.now();
  const toRecall = s.quotes
    .filter((q) => ['sent', 'viewed'].includes(q.status))
    .map((q) => ({
      q,
      customer: s.customers.find((c) => c.id === q.customer_id),
      overdue: new Date(q.follow_up_due).getTime() <= now
    }))
    .sort((a, b) => +new Date(a.q.follow_up_due) - +new Date(b.q.follow_up_due));

  const abandoned = s.quotes.filter((q) => q.status === 'abandoned').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Ciao, {company.name} 👋</h1>
        <p className="text-sm text-slate-600">
          Chi ricontattare oggi, cosa approvare e quanto valore è ancora in sospeso.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card">
          <div className="text-xs font-semibold uppercase text-slate-500">Valore in sospeso</div>
          <div className="mt-1 text-2xl font-extrabold">{eur(pendingValue)}</div>
          <div className="text-xs text-slate-500">{open.length} preventivi aperti</div>
        </div>
        <div className="card">
          <div className="text-xs font-semibold uppercase text-slate-500">Tasso accettazione</div>
          <div className="mt-1 text-2xl font-extrabold">{conv}%</div>
          <div className="text-xs text-slate-500">{accepted.length} accettati · {eur(acceptedValue)}</div>
        </div>
        <div className="card">
          <div className="text-xs font-semibold uppercase text-slate-500">Rifiutati / Abbandonati</div>
          <div className="mt-1 text-2xl font-extrabold">{declined.length} / {abandoned}</div>
          <div className="text-xs text-slate-500">su {total} totali</div>
        </div>
        <div className="card">
          <div className="text-xs font-semibold uppercase text-slate-500">Da approvare</div>
          <div className="mt-1 text-2xl font-extrabold">
            {s.messages.filter((m) => m.status === 'draft').length}
          </div>
          <Link href="/messaggi" className="text-xs font-semibold text-slate-900 underline">Vai ai messaggi →</Link>
        </div>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">🔔 Chi ricontattare</h2>
          <form action="/api/cron/reminders" method="post">
            <button className="btn-ghost" type="submit">Esegui promemoria ora</button>
          </form>
        </div>
        {toRecall.length === 0 && <p className="text-sm text-slate-500">Niente da ricontattare. Ottimo lavoro!</p>}
        <div className="overflow-x-auto">
          <table className="data">
            <thead><tr><th>Cliente</th><th>Preventivo</th><th>Importo</th><th>Ricontattare entro</th><th>Stato</th><th></th></tr></thead>
            <tbody>
              {toRecall.map(({ q, customer, overdue }) => (
                <tr key={q.id}>
                  <td><strong>{customer?.name}</strong><br /><span className="text-xs text-slate-500">{customer?.email}</span></td>
                  <td>{q.title}<br /><span className="text-xs text-slate-500">scade {new Date(q.valid_until).toLocaleDateString('it-IT')}</span></td>
                  <td className="font-bold">{eur(q.amount)}</td>
                  <td>
                    <span className={`badge ${overdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                      {overdue ? 'ORA' : new Date(q.follow_up_due).toLocaleDateString('it-IT')}
                    </span>
                  </td>
                  <td><span className="badge bg-slate-100">{q.status}</span></td>
                  <td className="whitespace-nowrap">
                    <Link className="btn-ghost mr-2" href={`/preventivi/${q.id}`}>Apri</Link>
                    <Link className="btn-ghost" href={`/api/quotes/${q.id}/pdf`}>PDF</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="mb-2 font-bold">📊 Esiti preventivi</h2>
          {['draft', 'sent', 'viewed', 'accepted', 'declined', 'abandoned', 'expired'].map((st) => {
            const n = s.quotes.filter((q) => q.status === st).length;
            const pct = total ? Math.round((n / total) * 100) : 0;
            return (
              <div key={st} className="mb-2 flex items-center gap-3 text-sm">
                <span className="w-24 font-mono text-xs">{st}</span>
                <div className="h-2 flex-1 rounded bg-slate-100">
                  <div className="h-2 rounded bg-slate-900" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-16 text-right text-xs text-slate-500">{n} ({pct}%)</span>
              </div>
            );
          })}
        </div>
        <div className="card">
          <h2 className="mb-2 font-bold">🧾 Ultimi eventi</h2>
          <ul className="space-y-2 text-sm">
            {[...s.events].reverse().slice(0, 8).map((e) => (
              <li key={e.id} className="rounded-xl bg-slate-50 px-3 py-2">
                <strong>{e.type}</strong> · {e.quote_id}
                {e.detail && <span className="text-slate-600"> — {e.detail}</span>}
                <div className="text-xs text-slate-400">{new Date(e.created_at).toLocaleString('it-IT')}</div>
              </li>
            ))}
            {s.events.length === 0 && <li className="text-slate-500">Nessun evento ancora.</li>}
          </ul>
          <h2 className="mb-2 mt-4 font-bold">✉️ Log invii</h2>
          <ul className="space-y-1 text-xs text-slate-600">
            {[...s.sendLogs].reverse().slice(0, 6).map((l) => (
              <li key={l.id} className="font-mono">{l.created_at.slice(0, 19)} · {l.kind} → {l.to_email} · {l.result} · {l.dedup_key}</li>
            ))}
            {s.sendLogs.length === 0 && <li>Nessun invio registrato.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
