/**
 * chat-sidebar.tsx — Collapsible sidebar listing past chat sessions, with
 * search-to-filter and a "New chat" action, styled after ChatGPT's sidebar.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, Search, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteSessionButton } from "@/components/chat/delete-session-button";

export type ChatSessionSummary = {
  id: string;
  title: string;
};

const COLLAPSED_STORAGE_KEY = "fitcoach:chat-sidebar-collapsed";

export function ChatSidebar({ sessions }: { sessions: ChatSessionSummary[] }) {
  const params = useParams<{ sessionId?: string }>();
  const activeSessionId = params?.sessionId;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage; reading it during render would cause a server/client hydration mismatch
      setIsCollapsed(localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1");
    } catch {
      // localStorage unavailable (private browsing, etc.) — default to expanded.
    }
  }, []);

  const filteredSessions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return sessions;
    return sessions.filter((session) => session.title.toLowerCase().includes(trimmed));
  }, [sessions, query]);

  function setCollapsed(next: boolean) {
    setIsCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Ignore — this is only a per-viewer convenience.
    }
  }

  function expandAndFocusSearch() {
    setCollapsed(false);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  if (isCollapsed) {
    return (
      <div className="hidden shrink-0 flex-col items-center gap-1 border-r p-2 sm:flex">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Expand chat sidebar"
          onClick={() => setCollapsed(false)}
        >
          <PanelLeftOpen className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Search chats"
          onClick={expandAndFocusSearch}
        >
          <Search className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="New chat" render={<Link href="/chat/new" />}>
          <SquarePen className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r sm:flex">
      <div className="flex items-center justify-between p-3 pb-2">
        <span className="text-sm font-semibold">FitCoach AI</span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Collapse chat sidebar"
          onClick={() => setCollapsed(true)}
        >
          <PanelLeftClose className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2 px-3 pb-2">
        <Button className="w-full" size="sm" render={<Link href="/chat/new" />}>
          <SquarePen className="size-4" />
          New chat
        </Button>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-3">
        {filteredSessions.length === 0 && (
          <p className="px-2 py-1.5 text-xs text-muted-foreground">No chats found.</p>
        )}
        {filteredSessions.map((session) => (
          <Link
            key={session.id}
            href={`/chat/${session.id}`}
            className={`group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm ${
              activeSessionId === session.id
                ? "bg-muted font-medium"
                : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <span className="truncate">{session.title}</span>
            <DeleteSessionButton sessionId={session.id} />
          </Link>
        ))}
      </nav>
    </aside>
  );
}
