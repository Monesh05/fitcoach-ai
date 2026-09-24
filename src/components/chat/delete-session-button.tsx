/**
 * delete-session-button.tsx — Deletes a chat session (cascades its messages)
 * via the RLS-scoped browser Supabase client.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const params = useParams<{ sessionId?: string }>();
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    setIsDeleting(true);
    const { error } = await supabase.from("chat_sessions").delete().eq("id", sessionId);
    setIsDeleting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (params?.sessionId === sessionId) {
      router.push("/chat");
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      aria-label="Delete chat"
      disabled={isDeleting}
      onClick={handleDelete}
      className="rounded p-0.5 text-muted-foreground opacity-0 hover:bg-muted hover:text-destructive group-hover:opacity-100"
    >
      <X className="size-3.5" />
    </button>
  );
}
