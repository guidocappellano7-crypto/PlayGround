import fs from 'fs';
import path from 'path';
import type { AppUser, Company, Customer, Message, Quote, QuoteEvent, ResetToken, SendLog } from './types';
import { DEMO_COMPANY_ID, DEMO_EMAIL, DEMO_PASSWORD } from './types';
import { isoDaysFromNow, newPublicToken, todayISO, uid } from './security';
import { hashPassword } from './auth';

export interface DB {
  companies: Company[];
  users: AppUser[];
  resetTokens: ResetToken[];
  customers: Customer[];
  quotes: Quote[];
  messages: Message[];
  sendLogs: SendLog[];
  events: QuoteEvent[];
}

const FILE = path.join(process.cwd(), '.data.demo.json');

function seed(): DB {
  const now = todayISO();
  const c1 = 'cus_mario';
  const c2 = 'cus_laura';
  const c3 = 'cus_tech';
  const { hash, salt } = hashPassword(DEMO_PASSWORD);
  return {
    companies: [
      { id: DEMO_COMPANY_ID, name: 'Rossi Impianti S.r.l.', email: 'preventivi@rossi-impianti.it' }
    ],
    users: [
      {
        id: 'usr_demo', company_id: DEMO_COMPANY_ID, name: 'Amministratore Demo',
        email: DEMO_EMAIL, pass_hash: hash, pass_salt: salt, created_at: now
      }
    ],
    resetTokens: [],
    customers: [
      {
        id: c1, company_id: DEMO_COMPANY_ID, name: 'Mario Bianchi',
        email: 'mario.bianchi@example.it', phone: '+39 333 111 2222',
        consent_marketing: true, consent_date: now, notes: 'Vuole sconto se chiude entro mese.',
        created_at: now
      },
      {
        id: c2, company_id: DEMO_COMPANY_ID, name: 'Laura Verdi',
        email: 'laura.verdi@example.it', phone: '+39 347 555 6666',
        consent_marketing: true, consent_date: now, notes: 'Ristrutturazione bagno.',
        created_at: now
      },
      {
        id: c3, company_id: DEMO_COMPANY_ID, name: 'Technofficina S.p.A.',
        email: 'acquisti@technofficina.example.it', phone: '+39 02 1234567',
        consent_marketing: false, consent_date: null, notes: 'Solo comunicazioni su preventivi richiesti.',
        created_at: now
      }
    ],
    quotes: [
      {
        id: 'quo_001', company_id: DEMO_COMPANY_ID, customer_id: c1,
        title: 'Climatizzazione bilocale — 2 split + installazione',
        amount: 3850, items: [
          { desc: 'Climatizzatore 9000 BTU x2', qty: 2, price: 1290 },
          { desc: 'Installazione e collaudo', qty: 1, price: 1270 }
        ],
        conditions: 'Validità 14 giorni. Acconto 30%. Garanzia 2 anni.',
        status: 'sent', valid_until: isoDaysFromNow(6), follow_up_due: isoDaysFromNow(-2),
        public_token: 'a3f9c21e4b5d6f7890abcdef1234567890abcdef1234567890abcdef12345678',
        last_opened_at: null, decided_at: null, decision_note: null,
        created_at: now, updated_at: now
      },
      {
        id: 'quo_002', company_id: DEMO_COMPANY_ID, customer_id: c2,
        title: 'Rifacimento bagno 6mq — opere + sanitari',
        amount: 9200, items: [
          { desc: 'Demolizione e smaltimento', qty: 1, price: 1400 },
          { desc: 'Idraulica + piastrelle + sanitari', qty: 1, price: 7800 }
        ],
        conditions: 'Validità 30 giorni. Pagamenti 30/40/30.',
        status: 'viewed', valid_until: isoDaysFromNow(20), follow_up_due: isoDaysFromNow(1),
        public_token: 'b7e11c02d94a4f68aa11cc99e0123456b7e11c02d94a4f68aa11cc99e0123456',
        last_opened_at: now, decided_at: null, decision_note: null,
        created_at: now, updated_at: now
      },
      {
        id: 'quo_003', company_id: DEMO_COMPANY_ID, customer_id: c3,
        title: 'Manutenzione annuale 12 impianti',
        amount: 5400, items: [{ desc: 'Canone manutenzione 12 mesi', qty: 12, price: 450 }],
        conditions: 'Canone mensile. Recesso 60gg.',
        status: 'accepted', valid_until: isoDaysFromNow(10), follow_up_due: isoDaysFromNow(10),
        public_token: 'c9aa44d17f2355aa90bc31ef55001122c9aa44d17f2355aa90bc31ef55001122',
        last_opened_at: now, decided_at: now, decision_note: 'Accettato via link.',
        created_at: now, updated_at: now
      }
    ],
    messages: [],
    sendLogs: [],
    events: [
      { id: uid('ev'), company_id: DEMO_COMPANY_ID, quote_id: 'quo_003', type: 'accepted', detail: 'Cliente ha cliccato Accetto.', created_at: now }
    ]
  };
}

export function loadDB(): DB {
  try {
    if (fs.existsSync(FILE)) {
      const raw = JSON.parse(fs.readFileSync(FILE, 'utf8')) as DB;
      // Migrazione: vecchi file senza utenti
      if (!raw.users) {
        const { hash, salt } = hashPassword(DEMO_PASSWORD);
        raw.users = [
          { id: 'usr_demo', company_id: DEMO_COMPANY_ID, name: 'Amministratore Demo', email: DEMO_EMAIL, pass_hash: hash, pass_salt: salt, created_at: todayISO() }
        ];
      }
      if (!raw.resetTokens) raw.resetTokens = [];
      return raw;
    }
  } catch { /* rigenera */ }
  const db = seed();
  try { fs.writeFileSync(FILE, JSON.stringify(db, null, 2)); } catch {}
  return db;
}

export function saveDB(db: DB) {
  try { fs.writeFileSync(FILE, JSON.stringify(db, null, 2)); } catch {}
}

// ---- Accesso multi-tenant: OGNI query filtra per company_id ----
export function companyScope(db: DB, companyId: string) {
  return {
    customers: db.customers.filter((c) => c.company_id === companyId),
    quotes: db.quotes.filter((q) => q.company_id === companyId),
    messages: db.messages.filter((m) => m.company_id === companyId),
    sendLogs: db.sendLogs.filter((s) => s.company_id === companyId),
    events: db.events.filter((e) => e.company_id === companyId)
  };
}

export { newPublicToken, uid };
