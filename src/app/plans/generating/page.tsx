/**
 * page.tsx (plan generating) — Auth-guarded wrapper for the post-onboarding
 * auto-generation screen.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GeneratingPlanScreen } from "@/components/plans/generating-plan-screen";

export default async function GeneratingPlanPage() {
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

  return <GeneratingPlanScreen />;
}
