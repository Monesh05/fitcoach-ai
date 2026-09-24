/**
 * run.ts (eval) — Orchestrates the full eval suite against the real
 * pipeline (hybrid retrieval, agent + tools, multimodal RAG, plan
 * generation, adversarial/safety) and writes a JSON + Markdown report.
 * Run with `npm run eval`. Requires EVAL_USER_EMAIL in .env.local to point
 * at an onboarded test account. Resumable: each category checkpoints
 * successful items to eval/results/checkpoints/*.json, so re-running after
 * hitting the free-tier daily quota only retries what's left.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEvalUser } from "@/eval/eval-user";
import { runRetrievalEval } from "./retrieval";
import { runTextAgentEval } from "./text-agent";
import { runMultimodalEval } from "./multimodal";
import { runAdversarialEval } from "./adversarial";
import { runPlanValidityEval } from "./plan-validity";

const RESULTS_DIR = path.join(process.cwd(), "eval", "results");

function fmt(value: number): string {
  return value.toFixed(1);
}

function completion(itemCount: number, completedCount: number): string {
  return completedCount === itemCount ? "" : ` (${completedCount}/${itemCount} completed — rest pending, re-run to resume)`;
}

async function main() {
  const supabase = createAdminClient();
  const user = await getEvalUser(supabase);
  console.log(`Running eval suite against ${user.email}...\n`);

  console.log("[1/5] Retrieval (Recall@5, MRR)...");
  const retrieval = await runRetrievalEval();

  console.log("[2/5] Fitness + nutrition questions (agent, citations, faithfulness)...");
  const fitness = await runTextAgentEval(supabase, user.id, "fitness.json", "fitness");
  const nutrition = await runTextAgentEval(supabase, user.id, "nutrition.json", "nutrition");

  console.log("[3/5] Multimodal RAG...");
  const multimodal = await runMultimodalEval(supabase, user.id);

  console.log("[4/5] Adversarial / safety...");
  const adversarial = await runAdversarialEval(supabase, user.id);

  console.log("[5/5] Plan generation JSON validity...");
  const planValidity = await runPlanValidityEval(supabase, user.id);

  const generatedAt = new Date().toISOString();
  const fullReport = { generatedAt, retrieval, fitness, nutrition, multimodal, adversarial, planValidity };

  await mkdir(RESULTS_DIR, { recursive: true });
  await writeFile(path.join(RESULTS_DIR, "latest.json"), JSON.stringify(fullReport, null, 2));

  const markdown = buildMarkdownReport(fullReport);
  await writeFile(path.join(RESULTS_DIR, "latest.md"), markdown);

  console.log("\n" + markdown);
  console.log(`\nFull results: eval/results/latest.json`);
  console.log(`Markdown report: eval/results/latest.md`);
}

function buildMarkdownReport(report: {
  generatedAt: string;
  retrieval: Awaited<ReturnType<typeof runRetrievalEval>>;
  fitness: Awaited<ReturnType<typeof runTextAgentEval>>;
  nutrition: Awaited<ReturnType<typeof runTextAgentEval>>;
  multimodal: Awaited<ReturnType<typeof runMultimodalEval>>;
  adversarial: Awaited<ReturnType<typeof runAdversarialEval>>;
  planValidity: Awaited<ReturnType<typeof runPlanValidityEval>>;
}): string {
  const { retrieval, fitness, nutrition, multimodal, adversarial, planValidity } = report;

  const fN = fitness.completedCount;
  const nN = nutrition.completedCount;
  const totalTextN = fN + nN || 1;
  const combinedCitation = (fitness.citationAccuracy * fN + nutrition.citationAccuracy * nN) / totalTextN;
  const combinedFaithfulness = (fitness.faithfulness * fN + nutrition.faithfulness * nN) / totalTextN;
  const combinedToolAccuracy = (fitness.toolCallAccuracy * fN + nutrition.toolCallAccuracy * nN) / totalTextN;

  const allCompleted = [fitness, nutrition, multimodal, adversarial].every(
    (r) => r.completedCount === r.itemCount,
  );

  return `# FitCoach AI — Evaluation Results

Generated: ${report.generatedAt}
Dataset: ${retrieval.itemCount + fitness.itemCount + nutrition.itemCount + multimodal.itemCount + adversarial.itemCount + planValidity.itemCount} items across fitness, nutrition, RAG retrieval, multimodal, adversarial/safety, and plan generation.
${allCompleted ? "" : "\n**Note: this run is partial** — some categories hit the OpenRouter free-tier daily quota mid-run. Percentages below are computed only over items that actually completed; re-run `npm run eval` after the quota resets to fill in the rest (already-completed items are skipped automatically).\n"}
| Metric | Result |
|---|---|
| Retrieval Recall@5 | ${fmt(retrieval.recallAt5)}% |
| Retrieval MRR | ${retrieval.mrr.toFixed(3)} |
| Citation accuracy (fitness) | ${fmt(fitness.citationAccuracy)}%${completion(fitness.itemCount, fitness.completedCount)} |
| Citation accuracy (nutrition) | ${fmt(nutrition.citationAccuracy)}%${completion(nutrition.itemCount, nutrition.completedCount)} |
| Citation accuracy (combined) | ${fmt(combinedCitation)}% |
| Answer faithfulness (combined, LLM-judged) | ${fmt(combinedFaithfulness)}% |
| Tool-call accuracy (combined) | ${fmt(combinedToolAccuracy)}% |
| Multimodal retrieval hit rate | ${fmt(multimodal.retrievalHitRate)}%${completion(multimodal.itemCount, multimodal.completedCount)} |
| Multimodal citation accuracy | ${fmt(multimodal.citationAccuracy)}% |
| Multimodal faithfulness | ${fmt(multimodal.faithfulness)}% |
| Structured output (plan JSON) validity | ${fmt(planValidity.validityRate)}%${completion(planValidity.itemCount, planValidity.completedCount)} |
| Adversarial/safety compliance rate | ${fmt(adversarial.safetyComplianceRate)}%${completion(adversarial.itemCount, adversarial.completedCount)} |
| Avg latency (text agent turn) | ${fmt((fitness.avgLatencyMs + nutrition.avgLatencyMs) / 2)}ms |
| P95 latency (text agent turn) | ${fmt(Math.max(fitness.p95LatencyMs, nutrition.p95LatencyMs))}ms |
| Avg tokens per text agent turn | ${fmt((fitness.avgTokens + nutrition.avgTokens) / 2)} |

## Dataset sizes
- Fitness: ${fitness.itemCount} (${fitness.completedCount} completed)
- Nutrition: ${nutrition.itemCount} (${nutrition.completedCount} completed)
- RAG retrieval: ${retrieval.itemCount}
- Multimodal: ${multimodal.itemCount} (${multimodal.completedCount} completed)
- Adversarial/safety: ${adversarial.itemCount} (${adversarial.completedCount} completed)
- Plan generation runs: ${planValidity.itemCount} (${planValidity.completedCount} completed)
`;
}

main().catch((error) => {
  console.error("Eval run failed:", error);
  process.exitCode = 1;
});
