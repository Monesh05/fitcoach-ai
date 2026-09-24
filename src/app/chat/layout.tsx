/**
 * layout.tsx (chat) — Auth- and onboarding-guarded shell shared by every
 * /chat/* route.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/nav/app-shell";
import { getChatSessions } from "@/lib/chat/sessions";

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

  const sessions = await getChatSessions(supabase, user.id);

  return (
    <AppShell
      userEmail={user.email ?? ""}
      title="AI Fitness Coach"
      subtitle="Your personalized training & nutrition assistant"
      sessions={sessions}
    >
      {children}
    </AppShell>
  );
}
