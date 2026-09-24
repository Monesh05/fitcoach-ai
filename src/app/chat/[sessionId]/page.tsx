/**
 * page.tsx (chat session) — Loads a persisted chat session's messages and
 * renders the chat client seeded with them.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import { notFound } from "next/navigation";
import { requireChatShell } from "@/lib/chat/guards";
import { AppShell } from "@/components/nav/app-shell";
import { ChatClient } from "@/components/chat/chat-client";
import { rowToUIMessage } from "@/lib/chat/messages";

export default async function ChatSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const { user, supabase, sessions } = await requireChatShell();

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

  return (
    <AppShell
      userEmail={user.email ?? ""}
      title="AI Fitness Coach"
      subtitle="Your personalized training & nutrition assistant"
      sessions={sessions}
    >
      <ChatClient sessionId={sessionId} initialMessages={initialMessages} />
    </AppShell>
  );
}
