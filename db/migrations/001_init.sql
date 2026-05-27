-- Credit Card Advisor initial schema.
-- Run in Supabase SQL editor or via `psql` after creating the project.

-- Enable pgvector for embedding similarity search.
create extension if not exists vector;

-- Profiles: 1:1 with auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Cards
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  issuer text,
  network text,
  last_four text,
  annual_fee numeric default 0,
  foreign_txn_fee_pct numeric default 0,
  signup_bonus jsonb,
  notes text,
  created_at timestamptz default now()
);
create index on public.cards(user_id);
alter table public.cards enable row level security;

create policy "cards: full CRUD on own" on public.cards for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Card categories (rewards multipliers)
create table public.card_categories (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  category text not null,
  multiplier numeric not null,
  cap_amount numeric,
  cap_period text,
  notes text
);
create index on public.card_categories(card_id);
alter table public.card_categories enable row level security;

create policy "card_categories: via parent" on public.card_categories for all
  using (exists (select 1 from public.cards c where c.id = card_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.cards c where c.id = card_id and c.user_id = auth.uid()));

-- Card embeddings for RAG
create table public.card_embeddings (
  card_id uuid primary key references public.cards(id) on delete cascade,
  embedding vector(768) not null,
  updated_at timestamptz default now()
);
alter table public.card_embeddings enable row level security;

create policy "card_embeddings: via parent" on public.card_embeddings for all
  using (exists (select 1 from public.cards c where c.id = card_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.cards c where c.id = card_id and c.user_id = auth.uid()));

-- Merchant -> category knowledge base (global, read-only for users)
create table public.merchant_categories (
  id uuid primary key default gen_random_uuid(),
  merchant text not null,
  category text not null,
  embedding vector(768),
  created_at timestamptz default now()
);
create index on public.merchant_categories using ivfflat (embedding vector_cosine_ops);
alter table public.merchant_categories enable row level security;

create policy "merchant_categories: read all authed" on public.merchant_categories
  for select to authenticated using (true);

-- Advisor query history
create table public.advisor_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  query text not null,
  response jsonb not null,
  created_at timestamptz default now()
);
create index on public.advisor_queries(user_id, created_at desc);
alter table public.advisor_queries enable row level security;

create policy "advisor_queries: own only" on public.advisor_queries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Vector search RPC for merchant lookup
create function match_merchant_category (
  query_embedding vector(768),
  match_count int default 3
)
returns table (id uuid, merchant text, category text, similarity float)
language sql stable as $$
  select id, merchant, category, 1 - (embedding <=> query_embedding) as similarity
  from public.merchant_categories
  where embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Vector search RPC for user's own cards
create function match_user_cards (
  user_id_input uuid,
  query_embedding vector(768),
  match_count int default 5
)
returns table (card_id uuid, similarity float)
language sql stable as $$
  select ce.card_id, 1 - (ce.embedding <=> query_embedding) as similarity
  from public.card_embeddings ce
  join public.cards c on c.id = ce.card_id
  where c.user_id = user_id_input
  order by ce.embedding <=> query_embedding
  limit match_count;
$$;
