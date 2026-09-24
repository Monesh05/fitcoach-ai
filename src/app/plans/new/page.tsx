/**
 * page.tsx (new plan) — Auth-guarded server wrapper for the plan request form.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/nav/app-shell";
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
    <AppShell userEmail={user.email ?? ""} title="New plan">
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-4">
        <div className="flex w-full max-w-md flex-col gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-brand/10">
              <Sparkles className="size-5 text-brand" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Generate a plan</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on the goals from your profile. Optionally narrow the focus below.
              </p>
            </div>
          </div>
          <NewPlanForm />
        </div>
      </div>
    </AppShell>
  );
}
