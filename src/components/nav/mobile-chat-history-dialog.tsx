/**
 * mobile-chat-history-dialog.tsx — Mobile-only access to chat history and
 * "new chat", surfaced from the top bar since the bottom nav only has room
 * for the four primary destinations.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import { History, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DeleteSessionButton } from "@/components/chat/delete-session-button";
import type { ChatSessionSummary } from "@/lib/chat/sessions";

export function MobileChatHistoryDialog({ sessions }: { sessions: ChatSessionSummary[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Chat history" className="sm:hidden" />
        }
      >
        <History className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chats</DialogTitle>
        </DialogHeader>
        <Button
          className="w-full justify-start"
          size="sm"
          render={<Link href="/chat/new" onClick={() => setIsOpen(false)} />}
        >
          <SquarePen className="size-4" />
          New chat
        </Button>
        <div className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
          {sessions.length === 0 && (
            <p className="px-1 py-2 text-sm text-muted-foreground">No chats yet.</p>
          )}
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/chat/${session.id}`}
              onClick={() => setIsOpen(false)}
              className="group flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            >
              <span className="truncate">{session.title}</span>
              <DeleteSessionButton sessionId={session.id} />
            </Link>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
