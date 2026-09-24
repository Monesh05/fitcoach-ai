/**
 * page.tsx (chat new) — Always creates a fresh chat session and redirects to it.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import { redirect } from "next/navigation";
import { requireOnboardedUser } from "@/lib/chat/guards";

export default async function NewChatPage() {
  const { user, supabase } = await requireOnboardedUser();

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
