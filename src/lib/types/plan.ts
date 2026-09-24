/**
 * plan.ts — Zod schema for a structured, AI-generated fitness/nutrition plan.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { z } from "zod";

export const exerciseSchema = z.object({
  name: z.string(),
  sets: z.number().int().positive(),
  reps: z.string(),
  notes: z.string().optional(),
});

export const trainingDaySchema = z.object({
  day: z.string(),
  focus: z.string(),
  exercises: z.array(exerciseSchema).min(1),
});

export const mealSchema = z.object({
  name: z.string(),
  description: z.string(),
  approxCalories: z.number().int().positive(),
  approxProteinGrams: z.number().int().nonnegative(),
});

export const planSchema = z.object({
  title: z.string().min(10),
  summary: z.string().min(40),
  weeklySchedule: z.array(trainingDaySchema),
  progressionNotes: z.string(),
  deloadSuggestion: z.string(),
  nutrition: z.object({
    dailyCalories: z.number().int().positive(),
    proteinGrams: z.number().int().positive(),
    carbsGrams: z.number().int().positive(),
    fatsGrams: z.number().int().positive(),
    notes: z.string(),
  }),
  sampleMealPlan: z.array(mealSchema),
  groceryList: z.array(z.string()),
  safetyNotes: z.string(),
});

export type Plan = z.infer<typeof planSchema>;
export type Exercise = z.infer<typeof exerciseSchema>;
export type TrainingDay = z.infer<typeof trainingDaySchema>;
export type Meal = z.infer<typeof mealSchema>;
