/**
 * page.tsx (plans list) — Lists the user's saved generated plans.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/nav/app-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeletePlanButton } from "@/components/plans/delete-plan-button";
import type { Plan } from "@/lib/types/plan";

export default async function PlansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: plans } = await supabase
    .from("generated_plans")
    .select("id, plan_json, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-svh flex-col">
      <AppNav userEmail={user.email ?? ""} />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">My plans</h1>
          <Button render={<Link href="/plans/new" />}>New plan</Button>
        </div>

        {(!plans || plans.length === 0) && (
          <p className="text-sm text-muted-foreground">
            No plans yet. Generate one tailored to your goals.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {plans?.map((row) => {
            const plan = row.plan_json as Plan;
            return (
              <Link key={row.id} href={`/plans/${row.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>{plan.title}</span>
                      <DeletePlanButton planId={row.id} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {plan.summary}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
