// ═══════════════════════════════════════════════════════════
// ❄️ CONFIG SERVER PRIVATO - ★ MODIFICA QUI IL TUO IP ★
// ═══════════════════════════════════════════════════════════
// 👉 QUESTO È IL FILE PROMEMORIA: cambia solo la PORTA se serve.
// L'IP locale lo metti nel client (js/config.js).
// Il server ascolta su 0.0.0.0 = raggiungibile da tutto il WiFi.
//
// COME TROVI L'IP DEL PC?
//   Windows: CMD → ipconfig → "Indirizzo IPv4" (es. 192.168.1.50)
//   Linux:   hostname -I
//   Mac:     Impostazioni → Wi-Fi → Dettagli
// ═══════════════════════════════════════════════════════════
module.exports = {
  PORT: 3001,              // ✏️ cambia solo se la porta è occupata
  HOST: "0.0.0.0",         // NON cambiare: serve per i telefoni in WiFi
  SAVE_FILE: "./database.json",
  MOTD: "❄️ Benvenuto nel server privato Gelo Infinito! ❄️"
};
