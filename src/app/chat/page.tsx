/**
 * page.tsx (chat index) — Resumes the most recent chat session, or creates
 * one if this user has none yet.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ChatIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: latestSession } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestSession) {
    redirect(`/chat/${latestSession.id}`);
  }

  const { data: newSession, error } = await supabase
    .from("chat_sessions")
    .insert({ user_id: user.id })
    .select("id")
    .single();

  if (error || !newSession) {
    throw new Error("Failed to create chat session.");
  }

  redirect(`/chat/${newSession.id}`);
}
