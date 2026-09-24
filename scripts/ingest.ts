/**
 * ingest.ts — Offline ingestion script: reads curated Markdown docs from
 * content/fitness-kb, chunks them, embeds each chunk via Gemini, and upserts
 * them into Supabase (documents + document_chunks). Idempotent: re-running
 * replaces any existing document with the same source filename (and its
 * chunks, via cascade) rather than duplicating it. Run with `npm run ingest`.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createAdminClient } from "@/lib/supabase/admin";
import { embedText } from "@/lib/ai/embeddings";
import { chunkText } from "@/lib/rag/chunk";

const CONTENT_DIR = path.join(process.cwd(), "content", "fitness-kb");

type ParsedDoc = {
  title: string;
  category: string;
  body: string;
};

function parseFrontmatter(raw: string): ParsedDoc {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error("Document is missing YAML frontmatter (title/category).");
  }

  const [, frontmatter, body] = match;
  const fields: Record<string, string> = {};

  for (const line of frontmatter.split("\n")) {
    const [key, ...rest] = line.split(":");
    if (!key || rest.length === 0) continue;
    fields[key.trim()] = rest.join(":").trim();
  }

  if (!fields.title || !fields.category) {
    throw new Error("Frontmatter must include both title and category.");
  }

  return { title: fields.title, category: fields.category, body: body.trim() };
}

async function ingestDocument(supabase: ReturnType<typeof createAdminClient>, fileName: string) {
  const filePath = path.join(CONTENT_DIR, fileName);
  const raw = await readFile(filePath, "utf-8");
  const { title, category, body } = parseFrontmatter(raw);

  const { error: deleteError } = await supabase.from("documents").delete().eq("source", fileName);
  if (deleteError) {
    throw new Error(`Failed to clear existing document "${fileName}": ${deleteError.message}`);
  }

  const { data: document, error: documentError } = await supabase
    .from("documents")
    .insert({ title, category, source: fileName })
    .select("id")
    .single();

  if (documentError || !document) {
    throw new Error(`Failed to insert document "${title}": ${documentError?.message}`);
  }

  const chunks = chunkText(body);
  console.log(`  ${fileName}: ${chunks.length} chunk(s)`);

  for (const [index, chunk] of chunks.entries()) {
    const embedding = await embedText(chunk);
    const { error: chunkError } = await supabase.from("document_chunks").insert({
      document_id: document.id,
      content: chunk,
      embedding,
      metadata: { title, category, chunk_index: index },
    });

    if (chunkError) {
      throw new Error(`Failed to insert chunk ${index} of "${title}": ${chunkError.message}`);
    }
  }
}

async function main() {
  const supabase = createAdminClient();
  const files = (await readdir(CONTENT_DIR)).filter((file) => file.endsWith(".md"));

  console.log(`Ingesting ${files.length} document(s) from ${CONTENT_DIR}...`);

  for (const file of files) {
    await ingestDocument(supabase, file);
  }

  console.log("Ingestion complete.");
}

main().catch((error) => {
  console.error("Ingestion failed:", error);
  process.exitCode = 1;
});
