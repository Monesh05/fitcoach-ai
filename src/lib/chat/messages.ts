/**
 * messages.ts — Converts between persisted chat_sessions/messages rows and
 * AI SDK UIMessage objects.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import type { UIMessage } from "ai";

export type MessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  image_url: string | null;
};

export function rowToUIMessage(row: MessageRow): UIMessage {
  return {
    id: row.id,
    role: row.role,
    parts: [
      ...(row.image_url
        ? [{ type: "file" as const, mediaType: "image/*", url: row.image_url }]
        : []),
      { type: "text" as const, text: row.content },
    ],
  };
}

const TITLE_MAX_LENGTH = 60;

export function deriveSessionTitle(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "Image message";
  return trimmed.length > TITLE_MAX_LENGTH
    ? `${trimmed.slice(0, TITLE_MAX_LENGTH)}...`
    : trimmed;
}
