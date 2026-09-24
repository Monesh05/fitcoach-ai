/**
 * openrouter.ts — Shared OpenRouter provider for the AI SDK, with helpers
 * that wire up OpenRouter's native `models` fallback (automatic server-side
 * failover across free-tier models) for each model role.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { TEXT_MODELS, VISION_MODELS } from "@/lib/ai/models";

function getOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY env var.");
  }

  return createOpenRouter({ apiKey });
}

export function getTextModel() {
  const [primary, ...fallbacks] = TEXT_MODELS;
  return getOpenRouter().chat(primary, { models: fallbacks });
}

export function getVisionModel() {
  const [primary, ...fallbacks] = VISION_MODELS;
  return getOpenRouter().chat(primary, { models: fallbacks });
}
