/**
 * models.ts — OpenRouter free-tier model configuration. Free models are
 * rate-limited and occasionally deprecated, so each role has a primary model
 * plus a fallback list passed via OpenRouter's native `models` request option
 * (server-side automatic fallback — see getOpenRouterModel in openrouter.ts).
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */

function parseModelList(envVar: string | undefined, fallback: string[]): string[] {
  if (!envVar) return fallback;
  const models = envVar.split(",").map((m) => m.trim()).filter(Boolean);
  return models.length > 0 ? models : fallback;
}

// All three must support tool/function calling — this list backs the agentic
// chat loop (see lib/ai/tools.ts), not just plain text generation.
export const TEXT_MODELS = parseModelList(process.env.OPENROUTER_TEXT_MODELS, [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nex-agi/nex-n2.5-pro:free",
]);

// google/gemma-4-31b-it:free was observed persistently rate-limited upstream
// (a provider-side limit, not our account's daily cap) across multiple days
// during eval runs, and OpenRouter's automatic `models` fallback array didn't
// reliably fail over away from it — so it's kept last rather than removed.
export const VISION_MODELS = parseModelList(process.env.OPENROUTER_VISION_MODELS, [
  "qwen/qwen3.8-27b:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
  "google/gemma-4-31b-it:free",
]);
