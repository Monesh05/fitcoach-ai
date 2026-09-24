/**
 * page.tsx (new plan) — Auth-guarded server wrapper for the plan request form.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/nav/app-nav";
import { NewPlanForm } from "@/components/plans/new-plan-form";

export default async function NewPlanPage() {
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

  return (
    <div className="flex min-h-svh flex-col">
      <AppNav userEmail={user.email ?? ""} />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 p-4">
        <div>
          <h1 className="text-lg font-semibold">Generate a plan</h1>
          <p className="text-sm text-muted-foreground">
            Based on the goals from your profile. Optionally narrow the focus below.
          </p>
        </div>
        <NewPlanForm />
      </div>
    </div>
  );
}
