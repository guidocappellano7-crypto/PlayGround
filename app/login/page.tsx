import Link from 'next/link';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default function Login({ searchParams }: { searchParams: { reset?: string; next?: string } }) {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="card">
        <h1 className="text-xl font-extrabold">Accedi</h1>
        <p className="text-sm text-slate-500">Area riservata aziende. I clienti usano il link del preventivo, senza login.</p>
        {searchParams.reset && (
          <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
            Password aggiornata. Accedi con le nuove credenziali.
          </div>
        )}
        <form className="mt-4 space-y-3" action="/api/auth" method="post">
          <div>
            <label className="label">Email aziendale</label>
            <input name="email" type="email" required className="input" placeholder="admin@tua-azienda.it" autoComplete="email" />
          </div>
          <div>
            <label className="label">Password</label>
            <input name="password" type="password" required className="input" placeholder="••••••••" autoComplete="current-password" />
          </div>
          <button className="btn-primary w-full" type="submit">Accedi alla dashboard</button>
        </form>
        <div className="mt-3 flex justify-between text-sm">
          <Link href="/recupero" className="font-semibold underline">Password dimenticata?</Link>
          <Link href="/signup" className="font-semibold underline">Crea account azienda</Link>
        </div>
      </div>
      <div className="card text-xs text-slate-500">
        <strong>Demo:</strong> email <code>{DEMO_EMAIL}</code> · password <code>{DEMO_PASSWORD}</code>
      </div>
    </div>
  );
}
