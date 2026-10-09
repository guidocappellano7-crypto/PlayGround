// Build setup: genera dist/index.html, snapshot statico self-contained del gestionale.
// Uso: `node scripts/build-static.mjs`. Non richiede dipendenze: solo node.
// La directory dist/ e' l'output statico dichiarato in deployment-output.json
// (hosting statico), mentre `start.sh` serve l'app Next.js completa in preview.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
mkdirSync(dist, { recursive: true });

const html = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Preventivi Smart — follow-up preventivi</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f8fafc;color:#0f172a;font-family:system-ui,-apple-system,sans-serif}
.wrap{max-width:72rem;margin:0 auto;padding:1.5rem 1rem 3rem}
header.top{display:flex;justify-content:space-between;align-items:center;background:#fff;border-bottom:1px solid #e2e8f0;padding:.75rem 1rem;position:sticky;top:0}
.logo{font-weight:800}.nav{display:flex;gap:.25rem;flex-wrap:wrap}.nav span{padding:.4rem .7rem;font-size:.85rem;font-weight:600;color:#334155}
h1{font-size:1.5rem;margin:1rem 0 .25rem}.sub{color:#475569;font-size:.9rem}
.grid{display:grid;gap:1rem;margin-top:1rem}@media(min-width:768px){.grid4{grid-template-columns:repeat(4,1fr)}.grid2{grid-template-columns:1fr 1fr}}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:1rem;padding:1.25rem;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.k{font-size:.7rem;font-weight:700;text-transform:uppercase;color:#64748b}.v{font-size:1.6rem;font-weight:800;margin:.25rem 0}.s{font-size:.75rem;color:#64748b}
table{width:100%;border-collapse:collapse;font-size:.85rem}th{text-align:left;font-size:.7rem;text-transform:uppercase;color:#64748b;padding-bottom:.5rem}td{border-top:1px solid #f1f5f9;padding:.6rem 0;vertical-align:top}
.badge{display:inline-block;border-radius:999px;padding:.1rem .6rem;font-size:.72rem;font-weight:700;background:#f1f5f9}.red{background:#fee2e2;color:#b91c1c}.amber{background:#fef3c7;color:#92400e}.green{background:#dcfce7;color:#15803d}
.bar{height:.5rem;background:#f1f5f9;border-radius:999px;flex:1}.bar>i{display:block;height:100%;background:#0f172a;border-radius:999px}
.row{display:flex;align-items:center;gap:.75rem;margin-bottom:.5rem;font-size:.85rem}.mono{font-family:monospace;font-size:.72rem;color:#94a3b8}
.btn{display:inline-block;background:#0f172a;color:#fff;border-radius:.75rem;padding:.6rem 1rem;font-size:.85rem;font-weight:700;text-decoration:none}
.note{font-size:.75rem;color:#64748b}.feat{font-size:.85rem;color:#334155;line-height:1.7}
footer{margin-top:2rem;font-size:.72rem;color:#94a3b8}
</style>
</head>
<body>
<header class="top"><div class="logo">📋 Preventivi Smart</div><nav class="nav"><span>Dashboard</span><span>Preventivi</span><span>Clienti</span><span>Messaggi</span><span>Setup &amp; GDPR</span></nav></header>
<div class="wrap">
<h1>Ciao, Rossi Impianti S.r.l. 👋</h1>
<p class="sub">Chi ricontattare oggi, cosa approvare e quanto valore è ancora in sospeso.</p>
<div class="grid grid4">
<div class="card"><div class="k">Valore in sospeso</div><div class="v">13.050,00&nbsp;€</div><div class="s">2 preventivi aperti</div></div>
<div class="card"><div class="k">Tasso accettazione</div><div class="v">33%</div><div class="s">1 accettati · 5.400,00&nbsp;€</div></div>
<div class="card"><div class="k">Rifiutati / Abbandonati</div><div class="v">0 / 0</div><div class="s">su 3 totali</div></div>
<div class="card"><div class="k">Da approvare</div><div class="v">1</div><div class="s">bozza promemoria in Messaggi</div></div>
</div>
<div class="card" style="margin-top:1rem">
<h2 style="margin:0 0 .5rem">🔔 Chi ricontattare</h2>
<div style="overflow-x:auto"><table>
<tr><th>Cliente</th><th>Preventivo</th><th>Importo</th><th>Ricontattare</th><th>Stato</th></tr>
<tr><td><strong>Mario Bianchi</strong><br><span class="note">mario.bianchi@example.it</span></td><td>Climatizzazione bilocale — 2 split + installazione</td><td><strong>3.850,00&nbsp;€</strong></td><td><span class="badge red">ORA</span></td><td><span class="badge">sent</span></td></tr>
<tr><td><strong>Laura Verdi</strong><br><span class="note">laura.verdi@example.it</span></td><td>Rifacimento bagno 6mq — opere + sanitari</td><td><strong>9.200,00&nbsp;€</strong></td><td><span class="badge amber">a breve</span></td><td><span class="badge">viewed</span></td></tr>
</table></div>
</div>
<div class="grid grid2">
<div class="card"><h2 style="margin:0 0 .5rem">📊 Esiti preventivi</h2>
<div class="row"><span class="mono" style="width:5rem">sent</span><div class="bar"><i style="width:33%"></i></div><span class="note">1</span></div>
<div class="row"><span class="mono" style="width:5rem">viewed</span><div class="bar"><i style="width:33%"></i></div><span class="note">1</span></div>
<div class="row"><span class="mono" style="width:5rem">accepted</span><div class="bar"><i style="width:33%"></i></div><span class="note">1</span></div>
<p class="note">Accettati, rifiutati e abbandonati registrati automaticamente dal portale cliente.</p></div>
<div class="card"><h2 style="margin:0 0 .5rem">✨ Cosa fa il gestionale</h2>
<div class="feat">✔ Promemoria idempotenti: mai lo stesso messaggio due volte.<br>✔ Bozze email (AI opzionale) sempre approvate da un umano.<br>✔ Portale cliente con link sicuro: Accetto · Ho una domanda · Non sono interessato.<br>✔ PDF stampabile, log invii, consensi e basi GDPR.<br>✔ Multi-tenancy con isolamento per azienda anche lato database.</div>
<p><span class="btn">Apri un preventivo dal link sicuro →</span></p>
<p class="note">Anteprima statica dimostrativa: l'app completa gira con Next.js + Supabase + Resend.</p></div>
</div>
<footer>L'AI prepara testi, non decide prezzi/condizioni e non invia da sola. Ogni invio richiede approvazione umana.</footer>
</div>
</body>
</html>`;

writeFileSync(join(dist, 'index.html'), html);
console.log('static snapshot written to', join(dist, 'index.html'));
