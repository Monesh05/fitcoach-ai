/**
 * chat-client.tsx — Streaming multimodal chat UI: text + image attachments,
 * rendered via the AI SDK's useChat hook against /api/chat.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolOrDynamicToolName,
  isFileUIPart,
  isTextUIPart,
  isToolUIPart,
  isDynamicToolUIPart,
  type UIMessage,
} from "ai";
import { Loader2, Paperclip, Send, Wrench, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getToolLabel } from "@/lib/ai/tool-labels";

export function ChatClient({
  sessionId,
  initialMessages,
}: {
  sessionId: string;
  initialMessages: UIMessage[];
}) {
  const router = useRouter();
  const isFirstMessage = initialMessages.length === 0;
  const { messages, sendMessage, status } = useChat({
    id: sessionId,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat", body: { sessionId } }),
    onError: (error) => toast.error(error.message || "Something went wrong."),
    onFinish: () => {
      if (isFirstMessage) router.refresh();
    },
  });

  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isStreaming = status === "submitted" || status === "streaming";

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setPendingImage(file);
    event.target.value = "";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim() && !pendingImage) return;

    const files = pendingImage ? [pendingImage] : undefined;
    setInput("");
    setPendingImage(null);

    await sendMessage(
      files ? { text: input, files: createFileList(files) } : { text: input },
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col p-4">
      <ScrollArea className="flex-1 py-4">
        <div className="flex flex-col gap-6">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ask about training, nutrition, or attach a photo of a meal or your lifting
              form for feedback.
            </p>
          )}
          {messages.map((message) => (
            <div key={message.id} className="flex items-start gap-3">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback>{message.role === "user" ? "You" : "AI"}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col gap-2">
                {message.parts.map((part, index) => {
                  if (isTextUIPart(part)) {
                    return (
                      <p key={index} className="whitespace-pre-wrap text-sm leading-relaxed">
                        {part.text}
                      </p>
                    );
                  }
                  if (isFileUIPart(part) && part.mediaType?.startsWith("image/")) {
                    return (
                      // eslint-disable-next-line @next/next/no-img-element -- remote/data-URL attachments, not a static asset
                      <img
                        key={index}
                        src={part.url}
                        alt={part.filename ?? "attached image"}
                        className="max-h-64 rounded-md border object-contain"
                      />
                    );
                  }
                  if (isToolUIPart(part) || isDynamicToolUIPart(part)) {
                    const toolName = getToolOrDynamicToolName(part);
                    const isRunning = part.state !== "output-available" && part.state !== "output-error";
                    return (
                      <div
                        key={index}
                        className="flex w-fit items-center gap-1.5 rounded-full border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
                      >
                        {isRunning ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Wrench className="size-3" />
                        )}
                        {getToolLabel(toolName)}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t pt-4">
        {pendingImage && (
          <div className="flex w-fit items-center gap-2 rounded-md border bg-muted px-2 py-1 text-sm">
            <span className="max-w-48 truncate">{pendingImage.name}</span>
            <button type="button" onClick={() => setPendingImage(null)}>
              <X className="size-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach an image"
          >
            <Paperclip className="size-4" />
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask FitCoach AI..."
            className="min-h-11 flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" size="icon" disabled={isStreaming}>
            <Send className="size-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function createFileList(files: File[]): FileList {
  const dataTransfer = new DataTransfer();
  for (const file of files) dataTransfer.items.add(file);
  return dataTransfer.files;
}
