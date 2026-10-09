export const dynamic = 'force-dynamic';

export default function Setup() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">Setup, sicurezza e GDPR</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card text-sm space-y-2">
          <h2 className="font-bold">🔌 Variabili d'ambiente</h2>
          <ul className="list-disc pl-5 text-slate-700">
            <li><code>NEXT_PUBLIC_BASE_URL</code> — URL pubblico (per i link /q/…)</li>
            <li><code>RESEND_API_KEY</code> + <code>EMAIL_FROM</code> — invio email reale. Senza, log in console (dev).</li>
            <li><code>OPENAI_API_KEY</code> (+ <code>OPENAI_MODEL</code>) — bozze AI. Senza, template locali. Il prodotto funziona comunque.</li>
            <li><code>CRON_SECRET</code> — protegge <code>POST /api/cron/reminders</code>.</li>
            <li><code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code> — produzione Supabase (schema in <code>/supabase</code>).</li>
            <li><code>STRIPE_SECRET_KEY</code> — (futuro) acconti quando avrai clienti.</li>
          </ul>
          <p className="text-xs text-slate-500">Demo locale: nessun segreto richiesto, dati in <code>.data.demo.json</code> (multi-tenant per company_id).</p>
        </div>
        <div className="card text-sm space-y-2">
          <h2 className="font-bold">🛡️ Sicurezza implementata</h2>
          <ul className="list-disc pl-5 text-slate-700">
            <li>Token link 256-bit non prevedibili (<code>crypto.randomBytes(32)</code>), scadenza <code>valid_until</code>.</li>
            <li>Pagina pubblica: lookup solo per token, nessun ID enumerabile, nessun dato di altri clienti.</li>
            <li>Multi-tenancy: ogni query filtra per <code>company_id</code>; in Supabase RLS verifica anche lato DB.</li>
            <li>Idempotenza: <code>dedup_key</code> UNIQUE (quote:tipo:data) + log invii; niente doppi invii.</li>
            <li>Rate-limit sul portale pubblico; decisioni registrate come eventi immodificabili.</li>
          </ul>
        </div>
        <div className="card text-sm space-y-2">
          <h2 className="font-bold">⚖️ Basi giuridiche (da validare col legale prima del lancio)</h2>
          <ul className="list-disc pl-5 text-slate-700">
            <li>Preventivi richiesti + comunicazioni connesse: <strong>misure precontrattuali (art. 6.1.b)</strong>.</li>
            <li>Marketing/promemoria commerciali generici: <strong>consenso (art. 6.1.a)</strong> — flag per cliente.</li>
            <li>Log invii e consensi conservati per prova; conservazione preventivi: 12 mesi dopo scadenza + anonimizza.</li>
            <li>DPA con Resend/Supabase/OpenAI/Stripe; opt-out sempre presente; data-breach plan.</li>
          </ul>
        </div>
        <div className="card text-sm space-y-2">
          <h2 className="font-bold">🤖 Limiti AI (hard rule)</h2>
          <ul className="list-disc pl-5 text-slate-700">
            <li>L'AI redige solo oggetto/corpo. Non tocca importi, voci, condizioni, scadenze.</li>
            <li>Nessun invio automatico: serve Approva → Invia umano.</li>
            <li>Nessuna accettazione/rifiuto automatica di offerte lato azienda.</li>
            <li>Se il provider AI è giù, fallback a template: il gestionale resta operativo.</li>
          </ul>
        </div>
      </div>
      <div className="card text-sm">
        <h2 className="font-bold">⏰ Automazioni</h2>
        <p className="text-slate-600">Chiama periodicamente (Vercel Cron / pg_cron / GitHub Actions):</p>
        <code className="mt-2 block rounded-xl bg-slate-900 p-3 font-mono text-xs text-emerald-300">curl -X POST $BASE/api/cron/reminders -H "Authorization: Bearer $CRON_SECRET"</code>
        <p className="mt-2 text-xs text-slate-500">Crea UNA bozza per preventivo scaduto nel follow-up (dedup per giorno), marca expired/abandoned automaticamente. Non invia da solo: l'invio resta umano.</p>
      </div>
    </div>
  );
}
