/**
 * targets.ts — Mifflin-St Jeor BMR/TDEE-based calorie and protein target
 * estimation, used to pre-fill onboarding and ground plan generation in real
 * numbers rather than the model guessing.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */

export type Sex = "male" | "female" | "other";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Goal = "lose_fat" | "build_muscle" | "recomp" | "maintain" | "general_fitness";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const CALORIE_ADJUSTMENT_BY_GOAL: Record<Goal, number> = {
  lose_fat: -500,
  build_muscle: 300,
  recomp: -100,
  maintain: 0,
  general_fitness: 0,
};

export const PROTEIN_G_PER_KG_BY_GOAL: Record<Goal, number> = {
  lose_fat: 2.2,
  build_muscle: 2.0,
  recomp: 2.2,
  maintain: 1.8,
  general_fitness: 1.8,
};

const MIN_CALORIE_FLOOR = 1200;
const FAT_SHARE_OF_CALORIES = 0.25;
const KCAL_PER_GRAM_PROTEIN = 4;
const KCAL_PER_GRAM_CARB = 4;
const KCAL_PER_GRAM_FAT = 9;

export function estimateBmr(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "male") return base + 5;
  if (sex === "female") return base - 161;
  return base - 78; // midpoint of the male/female offsets for "other"
}

export function estimateTargets({
  sex,
  weightKg,
  heightCm,
  age,
  activityLevel,
  goal,
}: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}): { calorieTarget: number; proteinTargetG: number } {
  const bmr = estimateBmr(sex, weightKg, heightCm, age);
  const maintenance = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  const calorieTarget = Math.max(
    MIN_CALORIE_FLOOR,
    Math.round(maintenance + CALORIE_ADJUSTMENT_BY_GOAL[goal]),
  );
  const proteinTargetG = Math.round(weightKg * PROTEIN_G_PER_KG_BY_GOAL[goal]);

  return { calorieTarget, proteinTargetG };
}

/**
 * Splits a daily calorie target into protein/carb/fat grams: protein from
 * bodyweight and goal (same table as estimateTargets), fat as a fixed share
 * of calories, and carbs absorbing the remainder.
 */
export function calculateMacros({
  calorieTarget,
  weightKg,
  goal,
}: {
  calorieTarget: number;
  weightKg: number;
  goal: Goal;
}): { proteinG: number; carbsG: number; fatsG: number } {
  const proteinG = Math.round(weightKg * PROTEIN_G_PER_KG_BY_GOAL[goal]);
  const fatsG = Math.round((calorieTarget * FAT_SHARE_OF_CALORIES) / KCAL_PER_GRAM_FAT);
  const remainingCalories = Math.max(
    0,
    calorieTarget - proteinG * KCAL_PER_GRAM_PROTEIN - fatsG * KCAL_PER_GRAM_FAT,
  );
  const carbsG = Math.round(remainingCalories / KCAL_PER_GRAM_CARB);

  return { proteinG, carbsG, fatsG };
}
