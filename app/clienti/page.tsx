import { companyScope, loadDB } from '@/lib/store';
import { requireCompanyId } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default function Clienti() {
  const db = loadDB();
  const s = companyScope(db, requireCompanyId());
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Clienti</h1>
      <div className="card">
        <h2 className="mb-2 font-bold">+ Nuovo cliente</h2>
        <form action="/api/customers" method="post" className="grid gap-3 md:grid-cols-4">
          <input name="name" required placeholder="Nome e cognome / Ragione sociale" className="input" />
          <input name="email" required type="email" placeholder="email@esempio.it" className="input" />
          <input name="phone" placeholder="Telefono" className="input" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="consent_marketing" value="1" /> Consenso marketing
          </label>
          <button className="btn-primary md:col-span-4" type="submit">Salva cliente</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Base giuridica: esecuzione di misure precontrattuali per i preventivi richiesti; consenso esplicito per marketing.
          Senza consenso marketing inviamo solo comunicazioni sul preventivo richiesto.
        </p>
      </div>
      <div className="card overflow-x-auto">
        <table className="data">
          <thead><tr><th>Nome</th><th>Email</th><th>Telefono</th><th>Consenso mkt</th><th>Note</th></tr></thead>
          <tbody>
            {s.customers.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.name}</strong></td>
                <td>{c.email}</td>
                <td>{c.phone || '—'}</td>
                <td>{c.consent_marketing ? '✅ sì' : '⛔ no'}</td>
                <td className="text-xs text-slate-500">{c.notes || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
