// Tipi di dominio. Prezzi e condizioni sono decisi SOLO dall'utente umano.
// L'AI può solo redigere testi (subject/body) e mai inviare in autonomia.

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'declined'
  | 'abandoned'
  | 'expired';

export type MessageStatus = 'draft' | 'approved' | 'sent' | 'failed';

export interface Company {
  id: string;
  name: string;
  email: string;
}

export interface Customer {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone?: string;
  consent_marketing: boolean;
  consent_date?: string | null;
  notes?: string;
  created_at: string;
}

export interface QuoteItem {
  desc: string;
  qty: number;
  price: number;
}

export interface Quote {
  id: string;
  company_id: string;
  customer_id: string;
  title: string;
  amount: number; // deciso dall'umano
  items: QuoteItem[];
  conditions: string; // deciso dall'umano
  status: QuoteStatus;
  valid_until: string; // ISO date
  follow_up_due: string; // ISO date — quando ricontattare
  public_token: string; // 256-bit non prevedibile
  last_opened_at?: string | null;
  decided_at?: string | null;
  decision_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  company_id: string;
  quote_id: string;
  channel: 'email';
  to_email: string;
  subject: string;
  body: string;
  status: MessageStatus;
  ai_generated: boolean;
  dedup_key: string; // chiave idempotenza: quote_id:tipo:data
  created_at: string;
  approved_at?: string | null;
  sent_at?: string | null;
  error?: string | null;
}

export interface SendLog {
  id: string;
  company_id: string;
  quote_id: string;
  message_id?: string | null;
  kind: 'initial' | 'reminder' | 'manual';
  to_email: string;
  dedup_key: string;
  result: 'sent' | 'skipped_duplicate' | 'failed' | 'dev_logged';
  created_at: string;
}

export interface QuoteEvent {
  id: string;
  company_id: string;
  quote_id: string;
  type: string;
  detail?: string;
  created_at: string;
}

export interface AppUser {
  id: string;
  company_id: string;
  name: string;
  email: string;
  pass_hash: string;
  pass_salt: string;
  created_at: string;
}

export interface ResetToken {
  token: string;
  user_id: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export const DEMO_COMPANY_ID = 'demo-azienda-rossi';
export const DEMO_EMAIL = 'admin@rossi-impianti.it';
export const DEMO_PASSWORD = 'Demo1234!';
