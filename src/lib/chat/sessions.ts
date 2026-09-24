/**
 * sessions.ts — Shared chat-session list query, used by the app sidebar on
 * every authenticated page (not just /chat/*).
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type ChatSessionSummary = { id: string; title: string };

export async function getChatSessions(
  supabase: SupabaseClient,
  userId: string,
): Promise<ChatSessionSummary[]> {
  const { data } = await supabase
    .from("chat_sessions")
    .select("id, title")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data ?? [];
}
