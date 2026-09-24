/**
 * page.tsx (chat session) — Loads a persisted chat session's messages and
 * renders the chat client seeded with them.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatClient } from "@/components/chat/chat-client";
import { rowToUIMessage } from "@/lib/chat/messages";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: session } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!session) {
    notFound();
  }

  const { data: messageRows } = await supabase
    .from("messages")
    .select("id, role, content, image_url")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  const initialMessages = (messageRows ?? []).map(rowToUIMessage);

  return <ChatClient sessionId={sessionId} initialMessages={initialMessages} />;
}
