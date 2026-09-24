-- 0001_init.sql — Core schema for FitCoach AI: profiles, RAG knowledge base
-- (documents/chunks with pgvector), chat history, and generated plans.
-- Author: Monesh Abinav <monesh.abinav@vigilnz.com>
-- Date: 2026-09-20

create extension if not exists vector;

-- Gemini gemini-embedding-001, truncated to 768 dims (outputDimensionality).
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  fitness_goals text,
  experience_level text check (experience_level in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz not null default now()
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents (id) on delete cascade,
  content text not null,
  embedding vector(768) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists document_chunks_embedding_idx
  on document_chunks using hnsw (embedding vector_cosine_ops);

create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists generated_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid references chat_sessions (id) on delete set null,
  plan_json jsonb not null,
  created_at timestamptz not null default now()
);

-- Cosine-similarity search over document_chunks for RAG retrieval.
create or replace function match_document_chunks(
  query_embedding vector(768),
  match_count int default 5
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.metadata,
    1 - (document_chunks.embedding <=> query_embedding) as similarity
  from document_chunks
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- Row Level Security: users only ever see their own chat/profile/plan data.
-- document_chunks/documents are shared reference data, readable by any
-- authenticated user, writable only via the service-role ingestion script.
alter table profiles enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table chat_sessions enable row level security;
alter table messages enable row level security;
alter table generated_plans enable row level security;

create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_upsert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

create policy "documents_read_authenticated" on documents for select using (auth.role() = 'authenticated');
create policy "document_chunks_read_authenticated" on document_chunks for select using (auth.role() = 'authenticated');

create policy "chat_sessions_owner" on chat_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "messages_owner" on messages for all
  using (exists (select 1 from chat_sessions where chat_sessions.id = messages.session_id and chat_sessions.user_id = auth.uid()))
  with check (exists (select 1 from chat_sessions where chat_sessions.id = messages.session_id and chat_sessions.user_id = auth.uid()));

create policy "generated_plans_owner" on generated_plans for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
