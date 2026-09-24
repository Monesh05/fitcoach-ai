/**
 * tools.ts — The fitness agent's tool set. Each tool closes over the
 * request's authenticated Supabase client and user id (never trusts a
 * client-supplied user id), so every DB read/write still goes through the
 * same RLS policies as the rest of the app. Used by the agentic chat loop in
 * app/api/chat/route.ts.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calculateMacros,
  estimateTargets,
  type ActivityLevel,
  type Goal,
  type Sex,
} from "@/lib/fitness/targets";
import {
  generateAndSavePlan,
  PROFILE_COLUMNS_FOR_PLANNING,
  type ProfileForPlanning,
} from "@/lib/fitness/generate-plan";
import {
  formatChunksAsContext,
  retrieveRelevantChunks,
  retrieveRelevantChunksByCategory,
} from "@/lib/rag/retrieve";
import { checkPlanRateLimit } from "@/lib/rate-limit";

const GOAL_ENUM = ["lose_fat", "build_muscle", "recomp", "maintain", "general_fitness"] as const;
const ACTIVITY_ENUM = ["sedentary", "light", "moderate", "active", "very_active"] as const;
const SEX_ENUM = ["male", "female", "other"] as const;

const DATE_STRING_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * z.string().date() renders as a `pattern` JSON-schema keyword, which some
 * OpenRouter free-tier backends' constrained-decoding grammars reject
 * outright (observed via eval runs). Accept a plain string and validate at
 * runtime instead, so a malformed date degrades to "use today" (the DB
 * column's default) rather than erroring the whole tool call.
 */
function asValidDateOrUndefined(value: string | undefined): string | undefined {
  return value && DATE_STRING_PATTERN.test(value) ? value : undefined;
}

async function fetchProfile(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS_FOR_PLANNING)
    .eq("id", userId)
    .maybeSingle();
  return data as ProfileForPlanning | null;
}

export function createFitnessTools(supabase: SupabaseClient, userId: string) {
  const get_user_profile = tool({
    description:
      "Get the user's saved fitness profile: body stats (age/sex/height/weight), goal, activity level, training experience, available equipment, dietary preferences, allergies, cuisine preference, and daily calorie/protein targets. Call this before giving personalized advice if you don't already know these details.",
    inputSchema: z.object({}),
    execute: async () => {
      const profile = await fetchProfile(supabase, userId);
      if (!profile?.age) {
        return { hasProfile: false, message: "User has not completed onboarding yet." };
      }
      return { hasProfile: true, profile };
    },
  });

  const get_weight_history = tool({
    description:
      "Get the user's logged bodyweight entries over a recent window, oldest first, plus the net change. Use this when the user asks about weight trends, progress, or whether they've gained/lost weight.",
    inputSchema: z.object({
      days: z.number().int().positive().max(365).default(90).describe("How many days back to look."),
    }),
    execute: async ({ days }) => {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("body_metrics")
        .select("weight_kg, recorded_at")
        .eq("user_id", userId)
        .gte("recorded_at", cutoff)
        .order("recorded_at", { ascending: true });

      if (error) return { error: error.message };
      const entries = data ?? [];
      const netChangeKg =
        entries.length >= 2
          ? Number(entries[entries.length - 1].weight_kg) - Number(entries[0].weight_kg)
          : null;

      return { entries, netChangeKg, entryCount: entries.length };
    },
  });

  const get_workout_history = tool({
    description:
      "Get the user's logged workouts over a recent window, most recent first, optionally filtered to one exercise. Use this to check training consistency or whether a specific lift has progressed.",
    inputSchema: z.object({
      days: z.number().int().positive().max(365).default(30).describe("How many days back to look."),
      exerciseName: z
        .string()
        .optional()
        .describe("Optional exact or partial exercise name to filter by, e.g. 'squat'."),
    }),
    execute: async ({ days, exerciseName }) => {
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      let query = supabase
        .from("workout_logs")
        .select("exercise_name, sets, performed_at")
        .eq("user_id", userId)
        .gte("performed_at", cutoff)
        .order("performed_at", { ascending: false })
        .limit(50);

      if (exerciseName) {
        query = query.ilike("exercise_name", `%${exerciseName}%`);
      }

      const { data, error } = await query;
      if (error) return { error: error.message };
      return { entries: data ?? [], entryCount: data?.length ?? 0 };
    },
  });

  const calculate_tdee = tool({
    description:
      "Calculate estimated BMR/TDEE and a suggested daily calorie target using the Mifflin-St Jeor equation. Uses the user's saved profile for any field not explicitly overridden (e.g. for a hypothetical 'what if I weighed X' question).",
    inputSchema: z.object({
      weightKg: z.number().positive().max(300).optional(),
      heightCm: z.number().positive().max(250).optional(),
      age: z.number().int().positive().max(100).optional(),
      sex: z.enum(SEX_ENUM).optional(),
      activityLevel: z.enum(ACTIVITY_ENUM).optional(),
      goal: z.enum(GOAL_ENUM).optional(),
    }),
    execute: async (overrides) => {
      const profile = await fetchProfile(supabase, userId);
      const merged = {
        weightKg: overrides.weightKg ?? profile?.weight_kg ?? undefined,
        heightCm: overrides.heightCm ?? profile?.height_cm ?? undefined,
        age: overrides.age ?? profile?.age ?? undefined,
        sex: (overrides.sex ?? profile?.sex ?? undefined) as Sex | undefined,
        activityLevel: (overrides.activityLevel ?? profile?.activity_level ?? undefined) as
          | ActivityLevel
          | undefined,
        goal: (overrides.goal ?? profile?.goal ?? undefined) as Goal | undefined,
      };

      if (
        !merged.weightKg ||
        !merged.heightCm ||
        !merged.age ||
        !merged.sex ||
        !merged.activityLevel ||
        !merged.goal
      ) {
        return {
          error:
            "Missing one or more required fields (weight, height, age, sex, activity level, goal) and no saved profile value to fall back on.",
        };
      }

      const targets = estimateTargets(
        merged as {
          weightKg: number;
          heightCm: number;
          age: number;
          sex: Sex;
          activityLevel: ActivityLevel;
          goal: Goal;
        },
      );

      return { ...targets, usedInputs: merged };
    },
  });

  const calculate_macros = tool({
    description:
      "Split a daily calorie target into protein/carb/fat grams. Uses the user's saved calorie target, weight, and goal for any field not explicitly overridden.",
    inputSchema: z.object({
      calorieTarget: z.number().int().positive().optional(),
      weightKg: z.number().positive().max(300).optional(),
      goal: z.enum(GOAL_ENUM).optional(),
    }),
    execute: async (overrides) => {
      const profile = await fetchProfile(supabase, userId);
      const calorieTarget = overrides.calorieTarget ?? profile?.calorie_target ?? undefined;
      const weightKg = overrides.weightKg ?? profile?.weight_kg ?? undefined;
      const goal = (overrides.goal ?? profile?.goal ?? undefined) as Goal | undefined;

      if (!calorieTarget || !weightKg || !goal) {
        return {
          error: "Missing calorie target, weight, or goal and no saved profile value to fall back on.",
        };
      }

      const macros = calculateMacros({ calorieTarget, weightKg, goal });
      return { calorieTarget, ...macros };
    },
  });

  const search_fitness_knowledge = tool({
    description:
      "Search the curated fitness/nutrition knowledge base for grounded reference material on any training or nutrition topic. Always use this before giving substantive advice so answers are grounded rather than guessed.",
    inputSchema: z.object({
      query: z.string(),
      limit: z.number().int().positive().max(10).default(5),
    }),
    execute: async ({ query, limit }) => {
      const chunks = await retrieveRelevantChunks(supabase, query.trim() || "general fitness and nutrition guidance", limit);
      return {
        results: chunks.map((c) => ({ title: c.metadata.title, content: c.content })),
        formatted: formatChunksAsContext(chunks),
      };
    },
  });

  const search_exercises = tool({
    description:
      "Search specifically for exercise technique/form reference material (e.g. squat form, deadlift cues). Narrower than search_fitness_knowledge — use when the question is specifically about how to perform an exercise.",
    inputSchema: z.object({
      query: z.string(),
      limit: z.number().int().positive().max(10).default(5),
    }),
    execute: async ({ query, limit }) => {
      const chunks = await retrieveRelevantChunksByCategory(
        supabase,
        query.trim() || "exercise form technique",
        ["exercise-form"],
        limit,
      );
      return { results: chunks.map((c) => ({ title: c.metadata.title, content: c.content })) };
    },
  });

  const search_foods = tool({
    description:
      "Search specifically for nutrition/food reference material (macros, meal ideas, cuisine substitutions). Narrower than search_fitness_knowledge — use when the question is specifically about food/nutrition.",
    inputSchema: z.object({
      query: z.string(),
      limit: z.number().int().positive().max(10).default(5),
    }),
    execute: async ({ query, limit }) => {
      const chunks = await retrieveRelevantChunksByCategory(
        supabase,
        query.trim() || "general nutrition guidance",
        ["nutrition"],
        limit,
      );
      return { results: chunks.map((c) => ({ title: c.metadata.title, content: c.content })) };
    },
  });

  const log_meal = tool({
    description:
      "Log a meal the user says they ate, with its estimated calories and macros. Only call this when the user clearly asks you to log/record a meal — never log speculatively.",
    inputSchema: z.object({
      name: z.string(),
      calories: z.number().int().nonnegative(),
      proteinG: z.number().int().nonnegative(),
      carbsG: z.number().int().nonnegative(),
      fatsG: z.number().int().nonnegative(),
      loggedAt: z.string().describe("YYYY-MM-DD; omit to use today").optional(),
    }),
    execute: async ({ name, calories, proteinG, carbsG, fatsG, loggedAt }) => {
      if (!name.trim()) return { success: false, error: "Meal name is required." };
      const validLoggedAt = asValidDateOrUndefined(loggedAt);
      const { error } = await supabase.from("meal_logs").insert({
        user_id: userId,
        name,
        calories,
        protein_g: proteinG,
        carbs_g: carbsG,
        fats_g: fatsG,
        ...(validLoggedAt ? { logged_at: validLoggedAt } : {}),
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    },
  });

  const log_workout = tool({
    description:
      "Log a completed exercise with its sets, for adherence and strength-progression tracking. Only call this when the user clearly asks you to log/record a workout — never log speculatively.",
    inputSchema: z.object({
      exerciseName: z.string(),
      sets: z.array(z.string()).describe("e.g. ['3x8 @ 60kg', '3x8 @ 62.5kg']"),
      performedAt: z.string().describe("YYYY-MM-DD; omit to use today").optional(),
    }),
    execute: async ({ exerciseName, sets, performedAt }) => {
      if (!exerciseName.trim() || sets.length === 0) {
        return { success: false, error: "Exercise name and at least one set are required." };
      }
      const validPerformedAt = asValidDateOrUndefined(performedAt);
      const { error } = await supabase.from("workout_logs").insert({
        user_id: userId,
        exercise_name: exerciseName,
        sets,
        ...(validPerformedAt ? { performed_at: validPerformedAt } : {}),
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    },
  });

  const create_workout_plan = tool({
    description:
      "Generate and save a new full structured one-week workout + nutrition plan tailored to the user's profile, viewable on their My Plans page. Only call this when the user clearly asks for a new/updated plan, not for general advice.",
    inputSchema: z.object({
      focus: z.string().optional().describe("Optional specific focus for this plan."),
    }),
    execute: async ({ focus }) => {
      const profile = await fetchProfile(supabase, userId);
      if (!profile?.age) {
        return { success: false, error: "User has not completed onboarding yet." };
      }
      const rateLimit = await checkPlanRateLimit(supabase, userId);
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: `Plan generation limit reached for now — try again in ${rateLimit.retryAfterMinutes} minutes.`,
        };
      }
      try {
        const { id, plan } = await generateAndSavePlan(supabase, userId, profile, focus);
        return { success: true, planId: id, title: plan.title, summary: plan.summary };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Plan generation failed.",
        };
      }
    },
  });

  const update_goal = tool({
    description:
      "Update the user's saved goal and/or daily calorie/protein targets. Only call this when the user explicitly asks to change their goal or targets, not as a side effect of casual conversation.",
    inputSchema: z
      .object({
        goal: z.enum(GOAL_ENUM).optional(),
        calorieTarget: z.number().int().min(800).max(6000).optional(),
        proteinTargetG: z.number().int().min(20).max(400).optional(),
      })
      .refine((v) => v.goal || v.calorieTarget || v.proteinTargetG, {
        message: "At least one field must be provided.",
      }),
    execute: async ({ goal, calorieTarget, proteinTargetG }) => {
      const update: Record<string, unknown> = {};
      if (goal) update.goal = goal;
      if (calorieTarget) update.calorie_target = calorieTarget;
      if (proteinTargetG) update.protein_target_g = proteinTargetG;

      const { error } = await supabase.from("profiles").update(update).eq("id", userId);
      if (error) return { success: false, error: error.message };
      return { success: true, updated: update };
    },
  });

  return {
    get_user_profile,
    get_weight_history,
    get_workout_history,
    calculate_tdee,
    calculate_macros,
    search_fitness_knowledge,
    search_exercises,
    search_foods,
    log_meal,
    log_workout,
    create_workout_plan,
    update_goal,
  };
}
