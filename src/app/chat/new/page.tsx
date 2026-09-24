/**
 * page.tsx (chat new) — Always creates a fresh chat session and redirects to it.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function NewChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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
