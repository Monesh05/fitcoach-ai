/**
 * page.tsx (plan detail) — Renders one saved structured plan.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/nav/app-nav";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
    <div className="flex min-h-svh flex-col">
      <AppNav userEmail={user.email ?? ""} />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4">
        {isNew && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
              <p className="text-sm font-medium">🎉 Your first plan is ready!</p>
              <Button size="sm" render={<Link href="/plans" />}>
                Continue to My Plans
              </Button>
            </CardContent>
          </Card>
        )}

        <div>
          <h1 className="text-xl font-semibold">{plan.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{plan.summary}</p>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Training</h2>
          {plan.weeklySchedule.map((day, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{day.day}</span>
                  <Badge variant="secondary">{day.focus}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col divide-y">
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <li
                      key={exerciseIndex}
                      className="flex flex-col gap-0.5 py-2 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium">{exercise.name}</span>
                        <Badge variant="outline" className="shrink-0">
                          {exercise.sets} x {exercise.reps}
                        </Badge>
                      </div>
                      {exercise.notes && (
                        <span className="text-xs text-muted-foreground">{exercise.notes}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardContent className="flex flex-col gap-2 pt-6 text-sm">
              <p>
                <span className="font-medium">Progression: </span>
                {plan.progressionNotes}
              </p>
              <p>
                <span className="font-medium">Deload: </span>
                {plan.deloadSuggestion}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Nutrition</h2>
          <Card>
            <CardContent className="flex flex-col gap-2 pt-6 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge>{plan.nutrition.dailyCalories} kcal</Badge>
                <Badge variant="secondary">{plan.nutrition.proteinGrams}g protein</Badge>
                <Badge variant="secondary">{plan.nutrition.carbsGrams}g carbs</Badge>
                <Badge variant="secondary">{plan.nutrition.fatsGrams}g fat</Badge>
              </div>
              <p className="text-muted-foreground">{plan.nutrition.notes}</p>
            </CardContent>
          </Card>

          <h3 className="text-xs font-semibold text-muted-foreground">Sample meal plan</h3>
          {plan.sampleMealPlan.map((meal, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{meal.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {meal.approxCalories} kcal · {meal.approxProteinGrams}g protein
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {meal.description}
              </CardContent>
            </Card>
          ))}

          <h3 className="text-xs font-semibold text-muted-foreground">Grocery list</h3>
          <Card>
            <CardContent className="pt-6">
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {plan.groceryList.map((item, index) => (
                  <li key={index}>• {item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground">{plan.safetyNotes}</p>
      </div>
    </div>
  );
}
