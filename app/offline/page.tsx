import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Offline() {
  return (
    <div className="mx-auto max-w-md">
      <div className="card text-center">
        <div className="text-4xl">📡</div>
        <h1 className="mt-2 text-xl font-extrabold">Sei offline</h1>
        <p className="mt-2 text-sm text-slate-600">
          L'app ha bisogno del server acceso per mostrare preventivi e clienti.
          Se stai provando in locale: accendi il PC server e collegati alla stessa rete Wi-Fi,
          poi ricarica.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Link href="/login" className="btn-primary">Riprova</Link>
        </div>
      </div>
    </div>
  );
}
