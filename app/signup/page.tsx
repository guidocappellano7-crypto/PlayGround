import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Signup() {
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="card">
        <h1 className="text-xl font-extrabold">Crea account azienda</h1>
        <p className="text-sm text-slate-500">Ogni azienda vede solo i propri dati (multi-tenancy). Piano vendibile in abbonamento.</p>
        {/* PUT via method-override: Next form supporta solo GET/POST -> usiamo campo nascosto e rotta dedicata */}
        <form className="mt-4 space-y-3" action="/api/auth/signup" method="post">
          <div>
            <label className="label">Il tuo nome</label>
            <input name="name" required className="input" placeholder="Mario Rossi" autoComplete="name" />
          </div>
          <div>
            <label className="label">Nome azienda</label>
            <input name="company" required className="input" placeholder="Rossi Impianti S.r.l." autoComplete="organization" />
          </div>
          <div>
            <label className="label">Email aziendale</label>
            <input name="email" type="email" required className="input" placeholder="admin@tua-azienda.it" autoComplete="email" />
          </div>
          <div>
            <label className="label">Password (min 8 caratteri)</label>
            <input name="password" type="password" required minLength={8} className="input" autoComplete="new-password" />
          </div>
          <button className="btn-primary w-full" type="submit">Crea account e apri dashboard</button>
        </form>
        <p className="mt-3 text-center text-sm">
          Hai già un account? <Link href="/login" className="font-semibold underline">Accedi</Link>
        </p>
      </div>
    </div>
  );
}
