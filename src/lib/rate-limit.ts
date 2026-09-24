/**
 * rate-limit.ts — Per-user request limits for expensive AI endpoints, backed
 * by simple count queries against existing tables rather than a separate
 * rate-limiting service. Not perfectly atomic under heavy concurrency, but
 * sufficient to stop casual abuse of the shared free-tier API keys.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterMinutes: number };

const CHAT_MESSAGE_LIMIT = 30;
const CHAT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const PLAN_GENERATION_LIMIT = 10;
const PLAN_WINDOW_MS = 24 * 60 * 60 * 1000; // 1 day

function windowResult(withinLimit: boolean, windowMs: number): RateLimitResult {
  return withinLimit ? { allowed: true } : { allowed: false, retryAfterMinutes: Math.ceil(windowMs / 60000) };
}

export async function checkChatRateLimit(
  supabase: SupabaseClient,
  userId: string,
): Promise<RateLimitResult> {
  const cutoff = new Date(Date.now() - CHAT_WINDOW_MS).toISOString();

  const { count, error } = await supabase
    .from("messages")
    .select("id, chat_sessions!inner(user_id)", { count: "exact", head: true })
    .eq("chat_sessions.user_id", userId)
    .eq("role", "user")
    .gte("created_at", cutoff);

  if (error) {
    console.error("Chat rate limit check failed, allowing request:", error.message);
    return { allowed: true };
  }

  return windowResult((count ?? 0) < CHAT_MESSAGE_LIMIT, CHAT_WINDOW_MS);
}

export async function checkPlanRateLimit(
  supabase: SupabaseClient,
  userId: string,
): Promise<RateLimitResult> {
  const cutoff = new Date(Date.now() - PLAN_WINDOW_MS).toISOString();

  const { count, error } = await supabase
    .from("generated_plans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", cutoff);

  if (error) {
    console.error("Plan rate limit check failed, allowing request:", error.message);
    return { allowed: true };
  }

  return windowResult((count ?? 0) < PLAN_GENERATION_LIMIT, PLAN_WINDOW_MS);
}
