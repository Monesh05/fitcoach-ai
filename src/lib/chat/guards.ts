/**
 * guards.ts — Shared auth/onboarding guards for the chat route segment,
 * factored out so each chat page (index/new/[sessionId]) can be a single
 * async Server Component that a route-level loading.tsx can suspend on,
 * instead of hiding that data-fetching inside a non-suspending layout.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { getChatSessions } from "@/lib/chat/sessions";

export async function requireOnboardedUser() {
  const user = await getAuthedUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("age")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.age) {
    redirect("/onboarding");
  }

  return { user, supabase };
}

export async function requireChatShell() {
  const { user, supabase } = await requireOnboardedUser();
  const sessions = await getChatSessions(supabase, user.id);
  return { user, supabase, sessions };
}
