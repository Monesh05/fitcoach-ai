/**
 * app-sidebar.tsx — The single persistent left sidebar for the authenticated
 * app: logo, new chat, chat history search, primary nav, and account
 * footer. Replaces the old split top AppNav + chat-only ChatSidebar so the
 * same shell appears on every authenticated page.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  Dumbbell,
  LineChart,
  LogOut,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  SquarePen,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteSessionButton } from "@/components/chat/delete-session-button";
import { createClient } from "@/lib/supabase/client";
import type { ChatSessionSummary } from "@/lib/chat/sessions";

type MealLogEntry = {
  id: string;
  name: string;
  calories: number;
  createdAt: string;
};

function formatLoggedAt(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const time = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}

const NAV_ITEMS = [
  { href: "/chat", label: "Chat", icon: MessageCircle, match: "/chat" },
  { href: "/plans", label: "My Plans", icon: ClipboardList, match: "/plans" },
  { href: "/progress", label: "Progress", icon: LineChart, match: "/progress" },
  { href: "/onboarding", label: "Profile", icon: UserRound, match: "/onboarding" },
];

const COLLAPSED_STORAGE_KEY = "fitcoach:app-sidebar-collapsed";

export function AppSidebar({
  userEmail,
  sessions,
}: {
  userEmail: string;
  sessions?: ChatSessionSummary[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [mealLogs, setMealLogs] = useState<MealLogEntry[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from localStorage; reading during render would cause a hydration mismatch
      setIsCollapsed(localStorage.getItem(COLLAPSED_STORAGE_KEY) === "1");
    } catch {
      // localStorage unavailable — default to expanded.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("meal_logs")
      .select("id, name, calories, created_at")
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (cancelled || !data) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing sidebar list from a client-only data fetch, not derivable from props
        setMealLogs(
          data.map((row) => ({
            id: row.id,
            name: row.name,
            calories: row.calories,
            createdAt: row.created_at,
          })),
        );
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch on route change so a just-logged meal shows up after navigating back to the app
  }, [pathname]);

  function setCollapsed(next: boolean) {
    setIsCollapsed(next);
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Per-viewer convenience only.
    }
  }

  function expandAndFocusSearch() {
    setCollapsed(false);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return sessions;
    return sessions.filter((session) => session.title.toLowerCase().includes(trimmed));
  }, [sessions, query]);

  const initial = userEmail ? userEmail[0]?.toUpperCase() : "?";

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (isCollapsed) {
    return (
      <aside className="hidden w-16 shrink-0 flex-col items-center border-r border-border bg-sidebar py-3 sm:flex">
        <Link href="/" className="mb-3 flex size-8 items-center justify-center rounded-md bg-foreground text-background">
          <Dumbbell className="size-4" />
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Expand sidebar"
          onClick={() => setCollapsed(false)}
        >
          <PanelLeftOpen className="size-4" />
        </Button>
        {sessions && (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Search chats"
            className="mt-1"
            onClick={expandAndFocusSearch}
          >
            <Search className="size-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="New chat"
          className="mt-1"
          render={<Link href="/chat/new" />}
        >
          <SquarePen className="size-4" />
        </Button>

        <nav className="mt-4 flex flex-col items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname?.startsWith(item.match);
            return (
              <Button
                key={item.href}
                variant="ghost"
                size="icon-sm"
                aria-label={item.label}
                render={<Link href={item.href} />}
                className={isActive ? "bg-muted text-foreground" : "text-muted-foreground"}
              >
                <item.icon className="size-4" />
              </Button>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-1">
          <div className="flex size-7 items-center justify-center rounded-full bg-brand/15 text-xs font-medium text-brand">
            {initial}
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Sign out" onClick={handleSignOut}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar sm:flex">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <div className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
            <Dumbbell className="size-3.5" />
          </div>
          FitCoach AI
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Collapse sidebar"
          onClick={() => setCollapsed(true)}
        >
          <PanelLeftClose className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2 px-3 pb-3">
        <Button className="w-full justify-start" size="sm" render={<Link href="/chat/new" />}>
          <SquarePen className="size-4" />
          New chat
        </Button>
        {sessions && (
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
        )}
      </div>

      {sessions && (
        <nav className="flex max-h-48 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
          {filteredSessions.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">No chats found.</p>
          )}
          {filteredSessions.map((session) => (
            <Link
              key={session.id}
              href={`/chat/${session.id}`}
              className={`group flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm ${
                pathname === `/chat/${session.id}`
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <span className="truncate">{session.title}</span>
              <DeleteSessionButton sessionId={session.id} />
            </Link>
          ))}
        </nav>
      )}

      {mealLogs.length > 0 && (
        <>
          <div className="my-1 border-t border-border" />
          <div className="flex flex-col gap-0.5 px-2 pt-1 pb-2">
            <p className="flex items-center gap-1.5 px-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <UtensilsCrossed className="size-3" />
              Recent meals
            </p>
            <div className="no-scrollbar flex max-h-36 flex-col gap-0.5 overflow-y-auto">
              {mealLogs.map((meal) => (
                <div key={meal.id} className="flex flex-col gap-0.5 rounded-md px-2 py-1.5">
                  <span className="truncate text-sm font-medium text-foreground">{meal.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatLoggedAt(meal.createdAt)} · {meal.calories} kcal
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="my-1 border-t border-border" />

      <nav className="flex flex-col gap-0.5 px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.match);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm ${
                isActive
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              }`}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 border-t border-border px-3 py-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/15 text-sm font-medium text-brand">
          {initial}
        </div>
        <span className="flex-1 truncate text-xs text-muted-foreground">{userEmail}</span>
        <Button variant="ghost" size="icon-sm" aria-label="Sign out" onClick={handleSignOut}>
          <LogOut className="size-4" />
        </Button>
      </div>
    </aside>
  );
}
