/**
 * page.tsx (onboarding) — Captures/edits the full fitness profile.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm, type OnboardingDefaults } from "@/components/onboarding/onboarding-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppShell } from "@/components/nav/app-shell";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "fitness_goals, experience_level, age, sex, height_cm, weight_kg, goal, activity_level, equipment, dietary_preferences, allergies, cuisine_preference, calorie_target, protein_target_g",
    )
    .eq("id", user.id)
    .maybeSingle();

  const defaults: OnboardingDefaults | undefined = profile
    ? {
        fitnessGoals: profile.fitness_goals ?? undefined,
        experienceLevel: profile.experience_level ?? undefined,
        age: profile.age ? String(profile.age) : undefined,
        sex: profile.sex ?? undefined,
        heightCm: profile.height_cm ? String(profile.height_cm) : undefined,
        weightKg: profile.weight_kg ? String(profile.weight_kg) : undefined,
        goal: profile.goal ?? undefined,
        activityLevel: profile.activity_level ?? undefined,
        equipment: profile.equipment ?? undefined,
        dietaryPreferences: profile.dietary_preferences ?? undefined,
        allergies: profile.allergies?.join(", ") ?? undefined,
        cuisinePreference: profile.cuisine_preference ?? undefined,
        calorieTarget: profile.calorie_target ? String(profile.calorie_target) : undefined,
        proteinTargetG: profile.protein_target_g ? String(profile.protein_target_g) : undefined,
      }
    : undefined;

  const form = (
    <div className="flex flex-1 items-center justify-center overflow-y-auto bg-muted/30 p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>{profile ? "Update your profile" : "Tell us about yourself"}</CardTitle>
          <CardDescription>
            This helps FitCoach AI tailor training, nutrition, and meal plans to you. You
            can update it anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm defaults={defaults} />
        </CardContent>
      </Card>
    </div>
  );

  if (!profile) {
    return <div className="flex min-h-svh flex-col">{form}</div>;
  }

  return (
    <AppShell userEmail={user.email ?? ""} title="Profile" subtitle="Your fitness profile and preferences">
      {form}
    </AppShell>
  );
}
