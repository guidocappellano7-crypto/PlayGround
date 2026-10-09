import { companyScope, loadDB } from '@/lib/store';
import { requireCompanyId } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default function Messaggi() {
  const db = loadDB();
  const s = companyScope(db, requireCompanyId());
  const drafts = s.messages.filter((m) => m.status === 'draft');
  const approved = s.messages.filter((m) => m.status === 'approved');
  const sent = s.messages.filter((m) => ['sent', 'failed'].includes(m.status));
  const Block = ({ title, list }: { title: string; list: typeof drafts }) => (
    <div className="card">
      <h2 className="mb-2 font-bold">{title} ({list.length})</h2>
      {list.map((m) => {
        const q = s.quotes.find((x) => x.id === m.quote_id);
        return (
          <div key={m.id} className="mb-2 rounded-xl border border-slate-200 p-3 text-sm">
            <div className="flex justify-between gap-2">
              <strong>{m.subject}</strong>
              <span className="badge bg-slate-100">{m.status}</span>
            </div>
            <div className="text-xs text-slate-500">Preventivo: {q?.title} → {m.to_email}</div>
            <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
            <div className="mt-2 flex gap-2">
              {m.status === 'draft' && (
                <form action={`/api/messages/${m.id}/approve`} method="post">
                  <button className="btn-primary" type="submit">Approva</button>
                </form>
              )}
              {m.status === 'approved' && (
                <form action={`/api/messages/${m.id}/send`} method="post">
                  <button className="btn-green" type="submit">Invia</button>
                </form>
              )}
            </div>
          </div>
        );
      })}
      {list.length === 0 && <p className="text-sm text-slate-500">Vuoto.</p>}
    </div>
  );
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Messaggi da approvare e inviare</h1>
      <Block title="📝 Bozze da revisionare" list={drafts} />
      <Block title="✅ Approvati, pronti all'invio" list={approved} />
      <Block title="📤 Inviati / falliti" list={sent} />
    </div>
  );
}
