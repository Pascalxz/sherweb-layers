-- Sherweb Layer — initial schema
-- Phase 1: brand_config, governance_rules, knowledge_chunks (pgvector), generations, profiles.
-- RLS is enabled but permissive: a single role, shared history (see CLAUDE.md §5).

create extension if not exists vector;

-- ──────────────────────────────────────────────────────────────────────
-- profiles: 1:1 with auth.users, lets us join display info into history.
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ──────────────────────────────────────────────────────────────────────
-- brand_config: single-row table holding design tokens + tone of voice.
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.brand_config (
  id text primary key,
  design_tokens jsonb not null,
  tone_of_voice jsonb not null,
  updated_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────
-- governance_rules: prompt-injected guardrails.
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.governance_rules (
  id text primary key,
  category text not null,
  rule text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────────────────────────────
-- knowledge_chunks: RAG corpus, embedded with text-embedding-3-small (1536).
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  content text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Helper for similarity search invoked by contextBuilder.
create or replace function public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  category text,
  title text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    kc.id,
    kc.category,
    kc.title,
    kc.content,
    1 - (kc.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks kc
  order by kc.embedding <=> query_embedding
  limit match_count;
$$;

-- ──────────────────────────────────────────────────────────────────────
-- generations: every output, shared history across users.
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete set null,
  output_type text not null,
  lang text not null default 'en',
  prompt text not null,
  output_html text not null,
  edited_html text,
  model text not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists generations_created_at_idx
  on public.generations (created_at desc);

-- ──────────────────────────────────────────────────────────────────────
-- RLS: single role, everyone sees everything (shared history).
-- ──────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.brand_config enable row level security;
alter table public.governance_rules enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.generations enable row level security;

-- Read: any authenticated user.
create policy "profiles_read_auth"    on public.profiles          for select to authenticated using (true);
create policy "brand_read_auth"       on public.brand_config      for select to authenticated using (true);
create policy "gov_read_auth"         on public.governance_rules  for select to authenticated using (true);
create policy "chunks_read_auth"      on public.knowledge_chunks  for select to authenticated using (true);
create policy "generations_read_auth" on public.generations       for select to authenticated using (true);

-- Write generations: only the row's own user_id.
create policy "generations_insert_self"
  on public.generations for insert to authenticated
  with check (auth.uid() = user_id);

create policy "generations_update_self"
  on public.generations for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- brand_config, governance_rules, knowledge_chunks: writes via service role only
-- (seed.ts uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS).
