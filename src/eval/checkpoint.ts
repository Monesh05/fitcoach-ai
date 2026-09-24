/**
 * checkpoint.ts — Per-category checkpointing so eval runs are resumable
 * across the free-tier daily quota. Each category's completed item results
 * are persisted to disk after every item; a re-run skips items that already
 * succeeded and only retries missing/errored ones.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CHECKPOINT_DIR = path.join(process.cwd(), "eval", "results", "checkpoints");

export async function loadCheckpoint<T extends { id: string; error?: string }>(
  category: string,
): Promise<Map<string, T>> {
  try {
    const raw = await readFile(path.join(CHECKPOINT_DIR, `${category}.json`), "utf-8");
    const items = JSON.parse(raw) as T[];
    return new Map(items.filter((item) => !item.error).map((item) => [item.id, item]));
  } catch {
    return new Map();
  }
}

export async function saveCheckpointItem<T extends { id: string }>(
  category: string,
  checkpoint: Map<string, T>,
  item: T,
): Promise<void> {
  checkpoint.set(item.id, item);
  await mkdir(CHECKPOINT_DIR, { recursive: true });
  await writeFile(
    path.join(CHECKPOINT_DIR, `${category}.json`),
    JSON.stringify(Array.from(checkpoint.values()), null, 2),
  );
}
