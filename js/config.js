// ═══════════════════════════════════════════════════════════
// ❄️ CONFIG CLIENT — ★★ MODIFICA QUI IL TUO IP LOCALE ★★
// ═══════════════════════════════════════════════════════════
// 👉 QUESTA È LA RIGA DA RICORDARE (l'unica che devi cambiare):
//
//     const SERVER_IP = "192.168.1.100";   ◄── ✏️ METTI L'IP DEL TUO PC
//
// COME TROVI L'IP DEL PC?
//   Windows: CMD → ipconfig → "Indirizzo IPv4"
//   Linux:   hostname -I
//   Mac:     Impostazioni → Wi-Fi → Dettagli
//
// Puoi cambiarlo ANCHE dentro il gioco: ⚙️ → campo IP → SALVA.
// ═══════════════════════════════════════════════════════════

// ✏️✏️✏️  CAMBIA QUESTO IP CON QUELLO DEL TUO PC  ✏️✏️✏️
const SERVER_IP = "192.168.1.100";

const SERVER_PORT = 3001; // stessa porta di server/CONFIG-IP.js
const SERVER_URL = `http://${SERVER_IP}:${SERVER_PORT}`;

// Nome giocatore (cambiabile nelle impostazioni)
let PLAYER_NAME = localStorage.getItem("wos_player") || ("Sopravvissuto" + Math.floor(Math.random() * 900 + 100));

function serverURL(path) {
  // se l'utente ha cambiato IP nelle impostazioni, usa quello
  const custom = localStorage.getItem("wos_server_ip");
  const base = custom ? `http://${custom}:${SERVER_PORT}` : SERVER_URL;
  return base + path;
}
