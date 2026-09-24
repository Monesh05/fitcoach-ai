/**
 * layout.tsx (chat) — Auth- and onboarding-guarded shell shared by every
 * /chat/* route: top nav + the chat session sidebar.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/nav/app-nav";
import { ChatSidebar } from "@/components/chat/chat-sidebar";

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("age")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.age) {
    redirect("/onboarding");
  }

  const { data: sessions } = await supabase
    .from("chat_sessions")
    .select("id, title")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex h-svh flex-col">
      <AppNav userEmail={user.email ?? ""} />
      <div className="flex flex-1 overflow-hidden">
        <ChatSidebar sessions={sessions ?? []} />
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
