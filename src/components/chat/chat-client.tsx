/**
 * chat-client.tsx — Streaming multimodal chat UI: text + image attachments,
 * markdown rendering with citation chips, and drag/drop composer.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from "react";
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
import {
  AlertTriangle,
  Apple,
  Camera,
  Dumbbell,
  Loader2,
  Paperclip,
  RotateCcw,
  Send,
  Sparkles,
  TrendingUp,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getToolLabel } from "@/lib/ai/tool-labels";
import { MarkdownContent } from "@/components/chat/markdown-content";

const SUGGESTIONS = [
  {
    icon: Dumbbell,
    label: "Build me a workout split",
    prompt: "Build me a 4-day workout split to build strength, based on my profile.",
  },
  {
    icon: Apple,
    label: "Review my nutrition",
    prompt: "How should I adjust my daily macros to support my current goal?",
  },
  {
    icon: Camera,
    label: "Critique my form",
    prompt: "Here's a photo of my squat — can you check my form and flag anything risky?",
  },
  {
    icon: TrendingUp,
    label: "Check my progress",
    prompt: "Based on my recent logs, am I progressing fast enough toward my goal?",
  },
];

export function ChatClient({
  sessionId,
  initialMessages,
}: {
  sessionId: string;
  initialMessages: UIMessage[];
}) {
  const router = useRouter();
  const isFirstMessage = initialMessages.length === 0;
  const { messages, sendMessage, status, error, regenerate, clearError } = useChat({
    id: sessionId,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat", body: { sessionId } }),
    onError: (err) => toast.error(err.message || "Something went wrong."),
    onFinish: () => {
      if (isFirstMessage) router.refresh();
    },
  });

  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSubmitted = status === "submitted";
  const isStreaming = status === "submitted" || status === "streaming";
  const lastMessage = messages[messages.length - 1];
  const isWaitingForFirstToken =
    isSubmitted && (!lastMessage || lastMessage.role === "user");

  const imagePreviewUrl = useMemo(
    () => (pendingImage ? URL.createObjectURL(pendingImage) : null),
    [pendingImage],
  );
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setPendingImage(file);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) setPendingImage(file);
  }

  async function submit(text: string, files?: File[]) {
    if (!text.trim() && !files?.length) return;
    setInput("");
    setPendingImage(null);
    await sendMessage(
      files?.length ? { text, files: createFileList(files) } : { text },
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    await submit(input, pendingImage ? [pendingImage] : undefined);
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col p-4">
      <ScrollArea className="min-h-0 flex-1 py-4">
        <div className="flex flex-col gap-6">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand/10">
                <Sparkles className="size-5 text-brand" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">What are we working on today?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ask about training or nutrition, or attach a photo for feedback.
                </p>
              </div>
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => submit(prompt)}
                    className="flex items-start gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 text-left text-sm transition-colors hover:border-brand/40 hover:bg-brand/5"
                  >
                    <Icon className="mt-0.5 size-4 shrink-0 text-brand" />
                    <span className="font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message) => {
            const isUser = message.role === "user";
            return (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback>{isUser ? "You" : "AI"}</AvatarFallback>
                </Avatar>
                <div className={`flex min-w-0 flex-1 flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
                  {message.parts.map((part, index) => {
                    if (isTextUIPart(part)) {
                      if (isUser) {
                        return (
                          <p
                            key={index}
                            className="max-w-[85%] rounded-2xl bg-muted px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap"
                          >
                            {part.text}
                          </p>
                        );
                      }
                      return <MarkdownContent key={index} text={part.text} />;
                    }
                    if (isFileUIPart(part) && part.mediaType?.startsWith("image/")) {
                      return (
                        // eslint-disable-next-line @next/next/no-img-element -- remote/data-URL attachments, not a static asset
                        <img
                          key={index}
                          src={part.url}
                          alt={part.filename ?? "attached image"}
                          className="max-h-64 rounded-lg border border-border object-contain"
                        />
                      );
                    }
                    if (isToolUIPart(part) || isDynamicToolUIPart(part)) {
                      const toolName = getToolOrDynamicToolName(part);
                      const isRunning = part.state !== "output-available" && part.state !== "output-error";
                      return (
                        <div
                          key={index}
                          className="flex w-fit items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground"
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
            );
          })}

          {isWaitingForFirstToken && (
            <div className="flex items-start gap-3">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1.5 pt-2 text-sm text-muted-foreground">
                <span className="flex gap-1">
                  <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-current" />
                </span>
                Thinking
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-4 text-destructive" />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-destructive">
                  {error.message || "Something went wrong generating a response."}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-fit"
                  onClick={() => {
                    clearError();
                    regenerate();
                  }}
                >
                  <RotateCcw className="size-3.5" />
                  Retry
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form
        onSubmit={handleSubmit}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col gap-2 rounded-2xl border pt-3 transition-colors ${
          isDragging ? "border-brand bg-brand/5" : "border-border"
        }`}
      >
        {pendingImage && imagePreviewUrl && (
          <div className="flex w-fit items-center gap-2 rounded-lg border border-border bg-muted px-2 py-1.5 mx-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not a static asset */}
            <img src={imagePreviewUrl} alt="Attachment preview" className="size-9 rounded object-cover" />
            <span className="max-w-40 truncate text-sm">{pendingImage.name}</span>
            <button
              type="button"
              onClick={() => setPendingImage(null)}
              aria-label="Remove attachment"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 px-3 pb-3">
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
            disabled={isStreaming}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach an image"
          >
            <Paperclip className="size-4" />
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isDragging ? "Drop image to attach..." : "Ask FitCoach AI..."}
            disabled={isStreaming}
            className="min-h-11 flex-1 resize-none border-0 shadow-none focus-visible:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" size="icon" disabled={isStreaming || (!input.trim() && !pendingImage)}>
            {isStreaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
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
