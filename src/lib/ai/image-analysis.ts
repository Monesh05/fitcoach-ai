/**
 * image-analysis.ts — First stage of the multimodal RAG pipeline: produces a
 * short, retrieval-oriented text description of an uploaded image so the
 * knowledge-base search is actually informed by what the image shows, not
 * just any accompanying user text.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import { convertToModelMessages, generateText, isFileUIPart, type FileUIPart, type UIMessage } from "ai";
import { getVisionModel } from "@/lib/ai/openrouter";

const DESCRIBE_PROMPT =
  "In one or two sentences, describe the fitness- or nutrition-relevant contents of this image (e.g. specific food items visible, or the exercise/lift and body position shown) so the description can be used as a search query against a fitness knowledge base. Be concrete and specific, not vague.";

export async function describeImageForRetrieval(imagePart: FileUIPart): Promise<string> {
  const syntheticMessage: UIMessage = {
    id: "image-analysis",
    role: "user",
    parts: [imagePart, { type: "text", text: DESCRIBE_PROMPT }],
  };

  try {
    const { text } = await generateText({
      model: getVisionModel(),
      messages: await convertToModelMessages([syntheticMessage]),
    });
    return text.trim();
  } catch (error) {
    console.error("Image description for retrieval failed:", error);
    return "";
  }
}

export function isImageFilePart(part: UIMessage["parts"][number]): part is FileUIPart {
  return isFileUIPart(part) && Boolean(part.mediaType?.startsWith("image/"));
}
