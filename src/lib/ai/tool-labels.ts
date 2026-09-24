/**
 * tool-labels.ts — Human-friendly labels for agent tool calls, shown in the
 * chat UI so tool use is visible rather than hidden.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */

const TOOL_LABELS: Record<string, string> = {
  get_user_profile: "Checking your profile",
  get_weight_history: "Reviewing weight history",
  get_workout_history: "Reviewing workout history",
  calculate_tdee: "Calculating calorie needs",
  calculate_macros: "Calculating macros",
  search_fitness_knowledge: "Searching the knowledge base",
  search_exercises: "Searching exercise reference",
  search_foods: "Searching nutrition reference",
  log_meal: "Logging meal",
  log_workout: "Logging workout",
  create_workout_plan: "Generating a new plan",
  update_goal: "Updating your goal",
};

export function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] ?? `Running ${toolName}`;
}
