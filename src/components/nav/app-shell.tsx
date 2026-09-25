/**
 * app-shell.tsx — The one layout wrapper every authenticated page uses:
 * desktop sidebar + mobile bottom nav + a contextual top bar, around the
 * page's own content. Keeps navigation structure identical everywhere
 * instead of each page wiring it up separately.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import { AppSidebar } from "@/components/nav/app-sidebar";
import { AppTopBar } from "@/components/nav/app-topbar";
import { MobileBottomNav } from "@/components/nav/mobile-bottom-nav";
import type { ChatSessionSummary } from "@/lib/chat/sessions";

export function AppShell({
  userEmail,
  title,
  subtitle,
  sessions,
  children,
}: {
  userEmail: string;
  title: string;
  subtitle?: string;
  sessions?: ChatSessionSummary[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-svh flex-col sm:flex-row">
      <AppSidebar userEmail={userEmail} sessions={sessions} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AppTopBar title={title} subtitle={subtitle} sessions={sessions} />
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden pb-14 sm:pb-0">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
