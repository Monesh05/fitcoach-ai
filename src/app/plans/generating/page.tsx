/**
 * page.tsx (plan generating) — Auth-guarded wrapper for the post-onboarding
 * auto-generation screen.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { GeneratingPlanScreen } from "@/components/plans/generating-plan-screen";

export default async function GeneratingPlanPage() {
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

  return <GeneratingPlanScreen />;
}
