-- ============================================================
-- Preventivi Smart — schema Supabase / PostgreSQL con RLS
-- Multi-tenancy: OGNI tabella ha company_id; le policy verificano
-- che auth.jwt() -> app_company_id coincida. Nessuna query senza filtro.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Tabelle ----------
create table if not exists companies (
  id text primary key,
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

create table if not exists profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_id text not null references companies(id) on delete cascade,
  role text not null default 'operator' check (role in ('owner','operator','viewer')),
  created_at timestamptz default now()
);

create table if not exists customers (
  id text primary key default ('cus_' || encode(gen_random_bytes(8),'hex')),
  company_id text not null references companies(id) on delete cascade,
  name text not null,
  email citext not null,
  phone text,
  consent_marketing boolean not null default false,
  consent_date timestamptz,
  notes text default '',
  created_at timestamptz default now()
);
create index if not exists idx_customers_company on customers(company_id);

create table if not exists quotes (
  id text primary key default ('quo_' || encode(gen_random_bytes(8),'hex')),
  company_id text not null references companies(id) on delete cascade,
  customer_id text not null references customers(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null check (amount > 0),
  items jsonb not null default '[]',
  conditions text not null default '',
  status text not null default 'draft'
    check (status in ('draft','sent','viewed','accepted','declined','abandoned','expired')),
  valid_until timestamptz not null,
  follow_up_due timestamptz not null,
  public_token text not null unique default encode(gen_random_bytes(32),'hex'),
  last_opened_at timestamptz,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_quotes_company_status on quotes(company_id, status);
create index if not exists idx_quotes_followup on quotes(company_id, follow_up_due) where status in ('sent','viewed');

create table if not exists messages (
  id text primary key default ('msg_' || encode(gen_random_bytes(8),'hex')),
  company_id text not null references companies(id) on delete cascade,
  quote_id text not null references quotes(id) on delete cascade,
  channel text not null default 'email',
  to_email citext not null,
  subject text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft','approved','sent','failed')),
  ai_generated boolean not null default false,
  dedup_key text not null unique,
  approved_at timestamptz,
  sent_at timestamptz,
  error text,
  created_at timestamptz default now()
);

create table if not exists send_logs (
  id text primary key default ('log_' || encode(gen_random_bytes(8),'hex')),
  company_id text not null references companies(id) on delete cascade,
  quote_id text not null references quotes(id) on delete cascade,
  message_id text references messages(id) on delete set null,
  kind text not null check (kind in ('initial','reminder','manual')),
  to_email citext not null,
  dedup_key text not null,
  result text not null check (result in ('sent','skipped_duplicate','failed','dev_logged')),
  created_at timestamptz default now(),
  unique(dedup_key, result)
);

create table if not exists quote_events (
  id text primary key default ('ev_' || encode(gen_random_bytes(8),'hex')),
  company_id text not null references companies(id) on delete cascade,
  quote_id text not null references quotes(id) on delete cascade,
  type text not null,
  detail text,
  created_at timestamptz default now()
);
create index if not exists idx_events_quote on quote_events(quote_id, created_at);

-- ---------- RLS ----------
alter table companies enable row level security;
alter table profiles enable row level security;
alter table customers enable row level security;
alter table quotes enable row level security;
alter table messages enable row level security;
alter table send_logs enable row level security;
alter table quote_events enable row level security;

-- Helper: company dell'utente loggato
create or replace function public.my_company() returns text
language sql stable as $$
  select company_id from public.profiles where user_id = auth.uid()
$$;

-- companies: vedi solo la tua
drop policy if exists c_self on companies;
create policy c_self on companies for all using (id = public.my_company());

-- profiles: ognuno vede il proprio; owner gestisce
drop policy if exists p_self on profiles;
create policy p_self on profiles for select using (user_id = auth.uid());

-- customers / quotes / messages / logs / events: isolamento per company_id
drop policy if exists cust_iso on customers;
create policy cust_iso on customers for all
  using (company_id = public.my_company()) with check (company_id = public.my_company());

drop policy if exists quo_iso on quotes;
create policy quo_iso on quotes for all
  using (company_id = public.my_company()) with check (company_id = public.my_company());

drop policy if exists msg_iso on messages;
create policy msg_iso on messages for all
  using (company_id = public.my_company()) with check (company_id = public.my_company());

drop policy if exists log_iso on send_logs;
create policy log_iso on send_logs for all
  using (company_id = public.my_company()) with check (company_id = public.my_company());

drop policy if exists ev_iso on quote_events;
create policy ev_iso on quote_events for all
  using (company_id = public.my_company()) with check (company_id = public.my_company());

-- ---------- Vista statistiche (valore in sospeso, esiti) ----------
create or replace view company_stats as
select company_id,
  count(*) filter (where status in ('sent','viewed')) as open_count,
  coalesce(sum(amount) filter (where status in ('sent','viewed')),0) as pending_value,
  count(*) filter (where status='accepted') as accepted_count,
  coalesce(sum(amount) filter (where status='accepted'),0) as accepted_value,
  count(*) filter (where status='declined') as declined_count,
  count(*) filter (where status='abandoned') as abandoned_count,
  count(*) as total_count
from quotes group by company_id;
