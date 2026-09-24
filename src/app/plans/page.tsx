/**
 * page.tsx (plans list) — Lists the user's saved generated plans.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, Flame, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { AppShell } from "@/components/nav/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeletePlanButton } from "@/components/plans/delete-plan-button";
import type { Plan } from "@/lib/types/plan";

export default async function PlansPage() {
  const user = await getAuthedUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("generated_plans")
    .select("id, plan_json, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <AppShell userEmail={user.email ?? ""} title="My Plans" subtitle="Your saved training and nutrition plans">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-4 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold sm:hidden">My Plans</h1>
              <p className="hidden text-sm text-muted-foreground sm:block">
                {plans?.length ?? 0} saved {plans?.length === 1 ? "plan" : "plans"}
              </p>
            </div>
            <Button render={<Link href="/plans/new" />}>
              <Plus className="size-4" />
              New plan
            </Button>
          </div>

          {(!plans || plans.length === 0) && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand/10">
                <ClipboardList className="size-5 text-brand" />
              </div>
              <p className="font-medium">No plans yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Generate a plan tailored to your goals, equipment, and diet — grounded in the
                same knowledge base as your chat.
              </p>
              <Button className="mt-2" render={<Link href="/plans/new" />}>
                Generate your first plan
              </Button>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {plans?.map((row) => {
              const plan = row.plan_json as Plan;
              return (
                <Link key={row.id} href={`/plans/${row.id}`} className="group">
                  <Card className="h-full transition-colors group-hover:border-brand/40 group-hover:bg-muted/30">
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between gap-2 text-base leading-snug">
                        <span>{plan.title}</span>
                        <DeletePlanButton planId={row.id} />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <p className="line-clamp-3 text-sm text-muted-foreground">{plan.summary}</p>
                      {plan.nutrition && (
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="secondary" className="gap-1">
                            <Flame className="size-3" />
                            {plan.nutrition.dailyCalories} kcal
                          </Badge>
                          <Badge variant="secondary">{plan.nutrition.proteinGrams}g protein</Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
