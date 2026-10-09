import './globals.css';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, readSession } from '@/lib/auth';

export const metadata = {
  title: 'Preventivi Smart — follow-up preventivi',
  description: 'Ricontatta i clienti, gestisci preventivi, misura il valore in sospeso.',
  manifest: '/manifest.webmanifest',
  themeColor: '#0f172a',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Preventivi' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  let email: string | null = null;
  try {
    email = readSession(cookies().get(SESSION_COOKIE)?.value)?.email || null;
  } catch { email = null; }

  return (
    <html lang="it">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-extrabold tracking-tight">
              📋 Preventivi Smart
            </Link>
            <nav className="flex items-center gap-1 text-sm font-medium">
              {email ? (
                <>
                  <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" href="/">Dashboard</Link>
                  <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" href="/preventivi">Preventivi</Link>
                  <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" href="/clienti">Clienti</Link>
                  <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" href="/messaggi">Messaggi</Link>
                  <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" href="/impostazioni">Setup & GDPR</Link>
                  <span className="ml-2 hidden text-xs text-slate-500 md:inline">{email}</span>
                  <form action="/api/auth/logout" method="post" className="ml-1">
                    <button className="rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-100" type="submit">Esci</button>
                  </form>
                </>
              ) : (
                <>
                  <Link className="rounded-lg px-3 py-2 hover:bg-slate-100" href="/login">Accedi</Link>
                  <Link className="rounded-lg bg-slate-900 px-3 py-2 text-white hover:bg-slate-700" href="/signup">Crea account</Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{});});}`
          }}
        />
        <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-slate-500">
          L'AI prepara testi, non decide prezzi/condizioni e non invia da sola. Ogni invio richiede approvazione umana.
        </footer>
      </body>
    </html>
  );
}
