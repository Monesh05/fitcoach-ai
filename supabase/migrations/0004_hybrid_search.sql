-- 0004_hybrid_search.sql — Adds keyword (full-text) search alongside the
-- existing vector search and combines both via Reciprocal Rank Fusion (RRF).
-- Pure embedding similarity can miss exact terms (specific exercise names,
-- numbers, nutrient names); keyword search catches those, while vector
-- search still handles paraphrased/semantic queries. RRF combines the two
-- rankings without needing to normalize incomparable similarity/rank scores.
-- Author: Monesh Abinav <monesh.abinav@vigilnz.com>
-- Date: 2026-09-20

alter table document_chunks
  add column if not exists content_tsv tsvector
  generated always as (to_tsvector('english', content)) stored;

create index if not exists document_chunks_content_tsv_idx
  on document_chunks using gin (content_tsv);

create or replace function hybrid_search_chunks(
  query_text text,
  query_embedding vector(768),
  match_count int default 5,
  rrf_k int default 60
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  score float
)
language sql stable
as $$
  with vector_search as (
    select
      document_chunks.id,
      row_number() over (order by document_chunks.embedding <=> query_embedding) as rank
    from document_chunks
    order by document_chunks.embedding <=> query_embedding
    limit greatest(match_count * 4, 20)
  ),
  keyword_search as (
    select
      document_chunks.id,
      row_number() over (
        order by ts_rank(document_chunks.content_tsv, plainto_tsquery('english', query_text)) desc
      ) as rank
    from document_chunks
    where document_chunks.content_tsv @@ plainto_tsquery('english', query_text)
    limit greatest(match_count * 4, 20)
  ),
  fused as (
    select
      coalesce(vector_search.id, keyword_search.id) as id,
      coalesce(1.0 / (rrf_k + vector_search.rank), 0.0)
        + coalesce(1.0 / (rrf_k + keyword_search.rank), 0.0) as score
    from vector_search
    full outer join keyword_search on vector_search.id = keyword_search.id
  )
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    document_chunks.metadata,
    fused.score
  from fused
  join document_chunks on document_chunks.id = fused.id
  order by fused.score desc
  limit match_count;
$$;

grant execute on function hybrid_search_chunks to authenticated, service_role;
