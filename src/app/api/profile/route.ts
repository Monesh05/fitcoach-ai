/**
 * route.ts (profile) — Upserts the caller's full fitness profile under their
 * own RLS-scoped session (age, body stats, goal, activity, equipment, diet,
 * allergies, cuisine preference, calorie/protein targets).
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  fitnessGoals: z.string().min(1),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]),
  age: z.number().int().min(13).max(100),
  sex: z.enum(["male", "female", "other"]),
  heightCm: z.number().min(100).max(250),
  weightKg: z.number().min(30).max(300),
  goal: z.enum(["lose_fat", "build_muscle", "recomp", "maintain", "general_fitness"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
  equipment: z.array(z.string()),
  dietaryPreferences: z.array(z.string()),
  allergies: z.array(z.string()),
  cuisinePreference: z.string().optional(),
  calorieTarget: z.number().int().min(800).max(6000),
  proteinTargetG: z.number().int().min(20).max(400),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedBody = profileSchema.safeParse(await request.json());
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? "Invalid profile data." },
      { status: 400 },
    );
  }

  const data = parsedBody.data;

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    fitness_goals: data.fitnessGoals,
    experience_level: data.experienceLevel,
    age: data.age,
    sex: data.sex,
    height_cm: data.heightCm,
    weight_kg: data.weightKg,
    goal: data.goal,
    activity_level: data.activityLevel,
    equipment: data.equipment,
    dietary_preferences: data.dietaryPreferences,
    allergies: data.allergies,
    cuisine_preference: data.cuisinePreference || null,
    calorie_target: data.calorieTarget,
    protein_target_g: data.proteinTargetG,
  });

  if (error) {
    return NextResponse.json({ error: `Failed to save profile: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
