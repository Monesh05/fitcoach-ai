-- 0002_grants.sql — Explicit table/schema grants. "Automatically expose new
-- tables" was disabled at project creation (recommended), which means
-- Postgres never granted base privileges to anon/authenticated/service_role —
-- RLS policies alone don't substitute for a GRANT. This adds the minimum
-- privileges each role needs; row-level access is still enforced by the RLS
-- policies from 0001_init.sql.
-- Author: Monesh Abinav <monesh.abinav@vigilnz.com>
-- Date: 2026-09-20

grant usage on schema public to anon, authenticated, service_role;

grant select on public.documents, public.document_chunks to authenticated;

grant select, insert, update, delete
  on public.profiles, public.chat_sessions, public.messages, public.generated_plans
  to authenticated;

grant execute on function public.match_document_chunks to authenticated, service_role;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated;
