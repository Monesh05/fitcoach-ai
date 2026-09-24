/**
 * errors.ts — Maps raw provider/model errors to short, user-safe messages.
 * Never leak internal error details (API error bodies, provider names,
 * upstream URLs) to end users — log the raw error server-side and show a
 * plain, actionable message instead.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */

export function friendlyModelErrorMessage(error: unknown): string {
  console.error("Model call failed:", error);

  const message = error instanceof Error ? error.message : String(error);

  if (/free-models-per-day/i.test(message)) {
    return "FitCoach AI has hit its shared daily usage limit for free AI models. This resets at midnight UTC — please try again after that.";
  }

  if (/rate.?limit/i.test(message)) {
    return "The AI model is temporarily busy. Please try again in a moment.";
  }

  return "Something went wrong generating a response. Please try again.";
}
