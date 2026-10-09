// ❄️ WHITEOUT CLONE — SERVER PRIVATO (IP locale del tuo PC) ❄️
// Avvio:  cd server && npm install && npm start
// Poi dal telefono (stesso WiFi): http://TUO-IP:3001/api/ping

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const cfg = require("./CONFIG-IP.js");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const DB_PATH = path.join(__dirname, "database.json");
let db = { players: {}, chat: [], ranking: [] };
try {
  if (fs.existsSync(DB_PATH)) db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
} catch (e) { console.log("DB resettato:", e.message); }

function saveDB() {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); } catch (e) {}
}

// ---------- API ----------
app.get("/api/ping", (req, res) => {
  res.json({ ok: true, motd: cfg.MOTD, time: Date.now(), online: Object.keys(db.players).length });
});

app.get("/api/ranking", (req, res) => {
  const list = Object.entries(db.players).map(([name, p]) => ({
    name,
    power: p.power || 0,
    furnace: (p.buildings?.furnace?.level) || 1,
    frostStars: p.frostStars || 0,
    updated: p.updated || 0
  })).sort((a, b) => b.power - a.power).slice(0, 50);
  res.json({ ok: true, ranking: list });
});

app.post("/api/save", (req, res) => {
  const { name, data } = req.body || {};
  if (!name || !data) return res.status(400).json({ ok: false, err: "name+data richiesti" });
  data.updated = Date.now();
  db.players[String(name).slice(0, 20)] = data;
  saveDB();
  res.json({ ok: true, saved: true });
});

app.get("/api/load/:name", (req, res) => {
  const p = db.players[req.params.name];
  if (!p) return res.json({ ok: false, err: "nessun salvataggio" });
  res.json({ ok: true, data: p });
});

app.get("/api/chat", (req, res) => {
  res.json({ ok: true, chat: db.chat.slice(-30) });
});

app.post("/api/chat", (req, res) => {
  const { name, text } = req.body || {};
  if (!name || !text) return res.status(400).json({ ok: false });
  db.chat.push({ name: String(name).slice(0, 20), text: String(text).slice(0, 200), t: Date.now() });
  db.chat = db.chat.slice(-100);
  saveDB();
  res.json({ ok: true });
});

// Evento globale tormenta deciso dal server (tutti i client sincronizzati)
app.get("/api/blizzard", (req, res) => {
  const cycle = Math.floor(Date.now() / 90000); // ogni 90s cambia
  const active = (cycle % 3 === 2); // 1 ciclo su 3 è tormenta
  res.json({ ok: true, blizzard: active, nextIn: 90000 - (Date.now() % 90000) });
});

app.listen(cfg.PORT, cfg.HOST, () => {
  console.log("");
  console.log("  ❄️❄️❄️  SERVER PRIVATO GELO INFINITO  ❄️❄️❄️");
  console.log(`  ✅ Attivo su http://localhost:${cfg.PORT}/api/ping`);
  console.log(`  📱 Dal telefono (stesso WiFi): http://TUO-IP-LOCALE:${cfg.PORT}/api/ping`);
  console.log(`  💡 Trova il tuo IP: Windows→ipconfig | Linux→hostname -I`);
  console.log(`  📝 Promemoria completo in: RICORDATI-IP.txt`);
  console.log("");
});
