import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Recupero({ searchParams }: { searchParams: { inviato?: string } }) {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="card">
        <h1 className="text-xl font-extrabold">Recupera password</h1>
        {searchParams.inviato ? (
          <div className="mt-3 space-y-2 text-sm">
            <div className="rounded-xl bg-emerald-50 p-3 font-semibold text-emerald-700">
              Se l'email esiste, abbiamo inviato il link di reset (valido 1 ora).
            </div>
            <p className="text-slate-500">In sviluppo il link compare anche nei log del server. Controlla la casella email (e lo spam).</p>
            <Link href="/login" className="font-semibold underline">Torna al login</Link>
          </div>
        ) : (
          <form className="mt-4 space-y-3" action="/api/auth/recover" method="post">
            <div>
              <label className="label">Email account</label>
              <input name="email" type="email" required className="input" placeholder="admin@tua-azienda.it" autoComplete="email" />
            </div>
            <button className="btn-primary w-full" type="submit">Invia link di reset</button>
            <p className="text-center text-sm"><Link href="/login" className="font-semibold underline">Torna al login</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
