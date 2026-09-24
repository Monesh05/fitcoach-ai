/**
 * onboarding-form.tsx — Captures the full profile used to personalize
 * training/nutrition plans: body stats, goal, activity, equipment, diet,
 * allergies, cuisine preference, and calorie/protein targets (auto-estimated
 * via Mifflin-St Jeor, editable). Used for both first-time onboarding and
 * later profile edits.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  estimateTargets,
  type ActivityLevel,
  type Goal,
  type Sex,
} from "@/lib/fitness/targets";

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "lose_fat", label: "Lose fat" },
  { value: "build_muscle", label: "Build muscle" },
  { value: "recomp", label: "Recomposition (lose fat + build muscle)" },
  { value: "maintain", label: "Maintain" },
  { value: "general_fitness", label: "General fitness" },
];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary (desk job, little exercise)" },
  { value: "light", label: "Light (exercise 1-3 days/week)" },
  { value: "moderate", label: "Moderate (exercise 3-5 days/week)" },
  { value: "active", label: "Active (exercise 6-7 days/week)" },
  { value: "very_active", label: "Very active (physical job or 2x/day training)" },
];

const EXPERIENCE_OPTIONS = [
  { value: "beginner", label: "Beginner — new to structured training" },
  { value: "intermediate", label: "Intermediate — training consistently for 6+ months" },
  { value: "advanced", label: "Advanced — training consistently for 2+ years" },
];

const EQUIPMENT_OPTIONS = [
  "Bodyweight only",
  "Dumbbells",
  "Barbell & rack",
  "Resistance bands",
  "Kettlebells",
  "Full gym access",
];

const DIETARY_OPTIONS = [
  "No restrictions",
  "Vegetarian",
  "Vegan",
  "Eggetarian",
  "Pescatarian",
  "Keto",
  "Gluten-free",
  "Dairy-free",
];

type ProfileFormState = {
  fitnessGoals: string;
  experienceLevel: string;
  age: string;
  sex: Sex | "";
  heightCm: string;
  weightKg: string;
  goal: Goal | "";
  activityLevel: ActivityLevel | "";
  equipment: string[];
  dietaryPreferences: string[];
  allergies: string;
  cuisinePreference: string;
  calorieTarget: string;
  proteinTargetG: string;
};

export type OnboardingDefaults = Partial<ProfileFormState>;

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function OnboardingForm({ defaults }: { defaults?: OnboardingDefaults }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState<ProfileFormState>({
    fitnessGoals: defaults?.fitnessGoals ?? "",
    experienceLevel: defaults?.experienceLevel ?? "beginner",
    age: defaults?.age ?? "",
    sex: defaults?.sex ?? "",
    heightCm: defaults?.heightCm ?? "",
    weightKg: defaults?.weightKg ?? "",
    goal: defaults?.goal ?? "",
    activityLevel: defaults?.activityLevel ?? "",
    equipment: defaults?.equipment ?? [],
    dietaryPreferences: defaults?.dietaryPreferences ?? [],
    allergies: defaults?.allergies ?? "",
    cuisinePreference: defaults?.cuisinePreference ?? "",
    calorieTarget: defaults?.calorieTarget ?? "",
    proteinTargetG: defaults?.proteinTargetG ?? "",
  });

  const suggestedTargets = useMemo(() => {
    const age = Number(state.age);
    const heightCm = Number(state.heightCm);
    const weightKg = Number(state.weightKg);

    if (
      !state.sex ||
      !state.goal ||
      !state.activityLevel ||
      !age ||
      !heightCm ||
      !weightKg
    ) {
      return null;
    }

    return estimateTargets({
      sex: state.sex,
      age,
      heightCm,
      weightKg,
      goal: state.goal,
      activityLevel: state.activityLevel,
    });
  }, [state.sex, state.goal, state.activityLevel, state.age, state.heightCm, state.weightKg]);

  function applySuggestedTargets() {
    if (!suggestedTargets) return;
    setState((prev) => ({
      ...prev,
      calorieTarget: String(suggestedTargets.calorieTarget),
      proteinTargetG: String(suggestedTargets.proteinTargetG),
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fitnessGoals: state.fitnessGoals,
          experienceLevel: state.experienceLevel,
          age: Number(state.age),
          sex: state.sex,
          heightCm: Number(state.heightCm),
          weightKg: Number(state.weightKg),
          goal: state.goal,
          activityLevel: state.activityLevel,
          equipment: state.equipment,
          dietaryPreferences: state.dietaryPreferences,
          allergies: state.allergies
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          cuisinePreference: state.cuisinePreference,
          calorieTarget: Number(state.calorieTarget || suggestedTargets?.calorieTarget),
          proteinTargetG: Number(state.proteinTargetG || suggestedTargets?.proteinTargetG),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save profile.");
      }

      router.push("/plans/generating");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-muted-foreground">About you</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              min={13}
              max={100}
              required
              value={state.age}
              onChange={(e) => setState((p) => ({ ...p, age: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sex">Sex</Label>
            <Select
              value={state.sex}
              onValueChange={(value) => setState((p) => ({ ...p, sex: value as Sex }))}
            >
              <SelectTrigger id="sex" className="w-full">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="heightCm">Height (cm)</Label>
            <Input
              id="heightCm"
              type="number"
              min={100}
              max={250}
              required
              value={state.heightCm}
              onChange={(e) => setState((p) => ({ ...p, heightCm: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="weightKg">Weight (kg)</Label>
            <Input
              id="weightKg"
              type="number"
              min={30}
              max={300}
              step="0.1"
              required
              value={state.weightKg}
              onChange={(e) => setState((p) => ({ ...p, weightKg: e.target.value }))}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Goal & activity</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="goal">Primary goal</Label>
          <Select
            value={state.goal}
            onValueChange={(value) => setState((p) => ({ ...p, goal: value as Goal }))}
          >
            <SelectTrigger id="goal" className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {GOAL_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="activityLevel">Activity level</Label>
          <Select
            value={state.activityLevel}
            onValueChange={(value) =>
              setState((p) => ({ ...p, activityLevel: value as ActivityLevel }))
            }
          >
            <SelectTrigger id="activityLevel" className="w-full">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="experienceLevel">Training experience</Label>
          <Select
            value={state.experienceLevel}
            onValueChange={(value) =>
              setState((p) => ({ ...p, experienceLevel: value ?? p.experienceLevel }))
            }
          >
            <SelectTrigger id="experienceLevel" className="w-full">
              <SelectValue className="capitalize" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fitnessGoals">Anything else about your goals?</Label>
          <Textarea
            id="fitnessGoals"
            required
            className="min-h-20"
            placeholder="e.g. Training for a half marathon in 3 months, want to keep strength up"
            value={state.fitnessGoals}
            onChange={(e) => setState((p) => ({ ...p, fitnessGoals: e.target.value }))}
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Equipment available</h2>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((option) => (
            <button
              type="button"
              key={option}
              onClick={() =>
                setState((p) => ({ ...p, equipment: toggleValue(p.equipment, option) }))
              }
              className={`rounded-full border px-3 py-1 text-xs ${
                state.equipment.includes(option)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-transparent"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Diet</h2>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map((option) => (
            <button
              type="button"
              key={option}
              onClick={() =>
                setState((p) => ({
                  ...p,
                  dietaryPreferences: toggleValue(p.dietaryPreferences, option),
                }))
              }
              className={`rounded-full border px-3 py-1 text-xs ${
                state.dietaryPreferences.includes(option)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-transparent"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="allergies">Allergies (comma-separated)</Label>
            <Input
              id="allergies"
              placeholder="e.g. peanuts, shellfish"
              value={state.allergies}
              onChange={(e) => setState((p) => ({ ...p, allergies: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cuisinePreference">Cuisine preference</Label>
            <Input
              id="cuisinePreference"
              placeholder="e.g. Indian, no preference"
              value={state.cuisinePreference}
              onChange={(e) => setState((p) => ({ ...p, cuisinePreference: e.target.value }))}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Daily targets</h2>
        {suggestedTargets && (
          <p className="text-xs text-muted-foreground">
            Suggested: {suggestedTargets.calorieTarget} kcal ·{" "}
            {suggestedTargets.proteinTargetG}g protein.{" "}
            <button
              type="button"
              onClick={applySuggestedTargets}
              className="underline underline-offset-2"
            >
              Use suggested
            </button>
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="calorieTarget">Daily calories</Label>
            <Input
              id="calorieTarget"
              type="number"
              placeholder={suggestedTargets ? String(suggestedTargets.calorieTarget) : undefined}
              value={state.calorieTarget}
              onChange={(e) => setState((p) => ({ ...p, calorieTarget: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="proteinTargetG">Daily protein (g)</Label>
            <Input
              id="proteinTargetG"
              type="number"
              placeholder={
                suggestedTargets ? String(suggestedTargets.proteinTargetG) : undefined
              }
              value={state.proteinTargetG}
              onChange={(e) => setState((p) => ({ ...p, proteinTargetG: e.target.value }))}
            />
          </div>
        </div>
      </section>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save and continue"}
      </Button>
    </form>
  );
}
