import { companyScope, loadDB } from '@/lib/store';
import { requireCompanyId } from '@/lib/session';
import { eur } from '@/lib/security';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Preventivi() {
  const db = loadDB();
  const s = companyScope(db, requireCompanyId());
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Preventivi</h1>
        <Link href="/preventivi/nuovo" className="btn-primary">+ Nuovo preventivo</Link>
      </div>
      <div className="card overflow-x-auto">
        <table className="data">
          <thead><tr><th>Titolo</th><th>Cliente</th><th>Importo</th><th>Stato</th><th>Scadenza</th><th>Link cliente</th><th></th></tr></thead>
          <tbody>
            {s.quotes.map((q) => {
              const c = s.customers.find((x) => x.id === q.customer_id);
              return (
                <tr key={q.id}>
                  <td><strong>{q.title}</strong><br /><span className="font-mono text-xs text-slate-400">{q.id}</span></td>
                  <td>{c?.name}</td>
                  <td className="font-bold">{eur(q.amount)}</td>
                  <td><span className="badge bg-slate-100">{q.status}</span></td>
                  <td className="text-xs">{new Date(q.valid_until).toLocaleDateString('it-IT')}</td>
                  <td><code className="rounded bg-slate-100 px-1 text-xs">/q/{q.public_token.slice(0, 10)}…</code></td>
                  <td className="whitespace-nowrap">
                    <Link className="btn-ghost mr-2" href={`/preventivi/${q.id}`}>Gestisci</Link>
                    <Link className="btn-ghost" href={`/q/${q.public_token}`}>Anteprima cliente</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
