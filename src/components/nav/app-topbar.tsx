/**
 * app-topbar.tsx — Slim contextual header above the page content: title,
 * optional subtitle, and (on mobile only) chat-history access when relevant.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import { Dumbbell } from "lucide-react";
import { MobileChatHistoryDialog } from "@/components/nav/mobile-chat-history-dialog";
import type { ChatSessionSummary } from "@/lib/chat/sessions";

export function AppTopBar({
  title,
  subtitle,
  sessions,
}: {
  title: string;
  subtitle?: string;
  sessions?: ChatSessionSummary[];
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
      <div className="flex items-center gap-2 sm:hidden">
        <div className="flex size-6 items-center justify-center rounded-md bg-foreground text-background">
          <Dumbbell className="size-3.5" />
        </div>
      </div>
      <div className="hidden flex-col sm:flex">
        <h1 className="text-sm font-semibold">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {sessions && <MobileChatHistoryDialog sessions={sessions} />}
    </header>
  );
}
