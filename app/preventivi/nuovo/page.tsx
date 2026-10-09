import { companyScope, loadDB } from '@/lib/store';
import { requireCompanyId } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default function NuovoPreventivo() {
  const db = loadDB();
  const s = companyScope(db, requireCompanyId());
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-extrabold">Nuovo preventivo</h1>
      <p className="text-sm text-slate-600">
        Prezzi, voci e condizioni li decidi tu. L'AI potrà solo aiutarti a scrivere il testo dell'email.
      </p>
      <form className="card space-y-4" action="/api/quotes" method="post">
        <div>
          <label className="label">Cliente</label>
          <select name="customer_id" className="input" required>
            {s.customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Titolo</label>
          <input name="title" className="input" required placeholder="Es. Rifacimento tetto 80mq" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Importo totale € (decidi tu)</label>
            <input name="amount" type="number" min="1" step="0.01" className="input" required placeholder="3500" />
          </div>
          <div>
            <label className="label">Validità (giorni)</label>
            <input name="valid_days" type="number" min="1" max="90" defaultValue={14} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Voci (una per riga: descrizione | qtà | prezzo)</label>
          <textarea name="items" className="input" rows={3} placeholder={'Manodopera | 1 | 1500\nMateriali | 1 | 2000'} />
        </div>
        <div>
          <label className="label">Condizioni contrattuali (decidi tu)</label>
          <textarea name="conditions" className="input" rows={2} defaultValue="Validità 14 giorni. Acconto 30%. Garanzia 2 anni." />
        </div>
        <button className="btn-primary w-full" type="submit">Crea preventivo + bozza messaggio</button>
      </form>
    </div>
  );
}
