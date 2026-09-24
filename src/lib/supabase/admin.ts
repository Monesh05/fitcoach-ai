/**
 * admin.ts — Service-role Supabase client for trusted server-only contexts
 * (ingestion scripts, background jobs). Bypasses RLS — never expose to the client
 * or use inside a route handler that serves untrusted requests.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
