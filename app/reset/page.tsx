export const dynamic = 'force-dynamic';

export default function Reset({ searchParams }: { searchParams: { token?: string } }) {
  const token = searchParams.token || '';
  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="card">
        <h1 className="text-xl font-extrabold">Nuova password</h1>
        {!token ? (
          <p className="mt-2 text-sm text-slate-600">Link non valido. Richiedi un nuovo reset dalla pagina di recupero.</p>
        ) : (
          <form className="mt-4 space-y-3" action="/api/auth/reset" method="post">
            <input type="hidden" name="token" value={token} />
            <div>
              <label className="label">Nuova password (min 8 caratteri)</label>
              <input name="password" type="password" required minLength={8} className="input" autoComplete="new-password" />
            </div>
            <button className="btn-primary w-full" type="submit">Salva nuova password</button>
          </form>
        )}
      </div>
    </div>
  );
}
