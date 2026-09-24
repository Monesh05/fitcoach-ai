/**
 * generate-plan.ts — Shared RAG-grounded plan generation used by both the
 * /api/plan route and the agent's create_workout_plan tool, so the two paths
 * can't drift out of sync.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { generateObject } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getTextModel } from "@/lib/ai/openrouter";
import { planSchema, type Plan } from "@/lib/types/plan";
import { formatChunksAsContext, retrieveRelevantChunks } from "@/lib/rag/retrieve";

export type ProfileForPlanning = {
  fitness_goals: string | null;
  experience_level: string | null;
  age: number | null;
  sex: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: string | null;
  activity_level: string | null;
  equipment: string[] | null;
  dietary_preferences: string[] | null;
  allergies: string[] | null;
  cuisine_preference: string | null;
  calorie_target: number | null;
  protein_target_g: number | null;
};

export const PROFILE_COLUMNS_FOR_PLANNING =
  "fitness_goals, experience_level, age, sex, height_cm, weight_kg, goal, activity_level, equipment, dietary_preferences, allergies, cuisine_preference, calorie_target, protein_target_g";

export async function generatePlan(
  supabase: SupabaseClient,
  profile: ProfileForPlanning,
  focus?: string,
): Promise<Plan> {
  const trimmedFocus = focus?.trim();
  const retrievalQuery = [profile.fitness_goals, profile.goal, trimmedFocus]
    .filter(Boolean)
    .join(". ");

  let context = "";
  try {
    const chunks = await retrieveRelevantChunks(supabase, retrievalQuery, 6);
    context = formatChunksAsContext(chunks);
  } catch (error) {
    console.error("RAG retrieval failed, continuing without context:", error);
  }

  const prompt = `Create a one-week workout and nutrition plan for this person:

- Age: ${profile.age}, sex: ${profile.sex}, height: ${profile.height_cm}cm, weight: ${profile.weight_kg}kg
- Training experience: ${profile.experience_level}
- Primary goal: ${profile.goal}
- Activity level: ${profile.activity_level}
- Available equipment: ${profile.equipment?.length ? profile.equipment.join(", ") : "not specified, assume bodyweight only"}
- Dietary preferences: ${profile.dietary_preferences?.length ? profile.dietary_preferences.join(", ") : "no restrictions"}
- Allergies to strictly avoid: ${profile.allergies?.length ? profile.allergies.join(", ") : "none"}
- Cuisine preference: ${profile.cuisine_preference || "no preference"}
- Daily targets: ${profile.calorie_target} kcal, ${profile.protein_target_g}g protein
- Additional context: ${profile.fitness_goals}
${trimmedFocus ? `- Specific focus for this plan: ${trimmedFocus}` : ""}

Ground the training/nutrition guidance in this reference material where relevant:
${context || "(no relevant reference material found)"}

Requirements:
- "title" must be a descriptive plan name a person would recognize (e.g. "One-Week Muscle-Building & Recomposition Plan"), never a technical identifier, field name, or literal echo of the focus text above.
- "summary" must be 2-4 real sentences describing who the plan is for and its overall approach (goal, split style, nutrition strategy). Never a single word or placeholder — treat the "specific focus" field above as a constraint to incorporate, not text to repeat verbatim as the summary.
- Only prescribe exercises that fit the available equipment.
- Every single day in weeklySchedule — including rest or active-recovery days — must list at least one entry in "exercises". For a true rest day, use an entry like { name: "Rest", sets: 1, reps: "—", notes: "Full rest or light walk" } rather than an empty list. For active recovery, list the actual activity (e.g. "Incline walk", "Mobility flow") with realistic sets/reps or duration in the reps field (e.g. "20-30 min").
- The sample meal plan and grocery list must respect the dietary preferences and NEVER include the listed allergens. If a cuisine preference is given, use dishes/substitutions from that cuisine (e.g. dal, paneer, roti-based meals for Indian) that hit the calorie/protein targets.
- Split the daily calorie/protein targets sensibly across the sample meals (they don't need to be exhaustive — 3-5 representative meals/snacks is enough).
- Keep total weekly training volume appropriate for their stated experience level and activity level.`;

  const { object: plan } = await generateObject({
    model: getTextModel(),
    schema: planSchema,
    prompt,
  });

  return plan;
}

export async function generateAndSavePlan(
  supabase: SupabaseClient,
  userId: string,
  profile: ProfileForPlanning,
  focus?: string,
): Promise<{ id: string; plan: Plan }> {
  const plan = await generatePlan(supabase, profile, focus);

  const { data: savedPlan, error } = await supabase
    .from("generated_plans")
    .insert({ user_id: userId, plan_json: plan })
    .select("id")
    .single();

  if (error || !savedPlan) {
    throw new Error(`Failed to save plan: ${error?.message}`);
  }

  return { id: savedPlan.id, plan };
}
