/**
 * page.tsx (plan detail) — Renders one saved structured plan.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PartyPopper } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { AppShell } from "@/components/nav/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Plan } from "@/lib/types/plan";

export default async function PlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { id } = await params;
  const { new: isNew } = await searchParams;
  const user = await getAuthedUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("generated_plans")
    .select("plan_json, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row) {
    notFound();
  }

  const plan = row.plan_json as Plan;

  return (
    <AppShell userEmail={user.email ?? ""} title={plan.title} subtitle="Weekly training & nutrition plan">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 sm:p-8">
          {isNew && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-medium text-brand">
                <PartyPopper className="size-4" />
                Your first plan is ready!
              </p>
              <Button size="sm" render={<Link href="/plans" />}>
                Continue to My Plans
              </Button>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{plan.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {plan.summary}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-brand text-brand-foreground">
                {plan.nutrition.dailyCalories} kcal
              </Badge>
              <Badge variant="secondary">{plan.nutrition.proteinGrams}g protein</Badge>
              <Badge variant="secondary">{plan.nutrition.carbsGrams}g carbs</Badge>
              <Badge variant="secondary">{plan.nutrition.fatsGrams}g fat</Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              This week
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {plan.weeklySchedule.map((day, index) => (
                <Card key={index} className="gap-3">
                  <CardHeader>
                    <CardTitle className="flex items-baseline justify-between text-sm">
                      <span className="text-xs font-semibold tracking-wide text-brand uppercase">
                        {day.day}
                      </span>
                      <span className="font-normal text-muted-foreground">{day.focus}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-col divide-y divide-border">
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <li
                          key={exerciseIndex}
                          className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="font-medium">{exercise.name}</span>
                            <span className="shrink-0 font-mono text-xs text-muted-foreground">
                              {exercise.sets} × {exercise.reps}
                            </span>
                          </div>
                          {exercise.notes && (
                            <span className="text-xs text-muted-foreground">
                              {exercise.notes}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="flex flex-col gap-2 pt-6 text-sm">
                <p>
                  <span className="font-medium">Progression: </span>
                  <span className="text-muted-foreground">{plan.progressionNotes}</span>
                </p>
                <p>
                  <span className="font-medium">Deload: </span>
                  <span className="text-muted-foreground">{plan.deloadSuggestion}</span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Nutrition
            </h2>
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                {plan.nutrition.notes}
              </CardContent>
            </Card>

            <h3 className="mt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Sample meal plan
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {plan.sampleMealPlan.map((meal, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span>{meal.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {meal.approxCalories} kcal
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {meal.description}
                  </CardContent>
                </Card>
              ))}
            </div>

            <h3 className="mt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Grocery list
            </h3>
            <Card>
              <CardContent className="pt-6">
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-3">
                  {plan.groceryList.map((item, index) => (
                    <li key={index} className="flex items-center gap-1.5">
                      <span className="size-1 shrink-0 rounded-full bg-muted-foreground" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">{plan.safetyNotes}</p>
        </div>
      </div>
    </AppShell>
  );
}
