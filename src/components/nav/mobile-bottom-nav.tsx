/**
 * mobile-bottom-nav.tsx — Real mobile navigation (not a shrunk sidebar):
 * a fixed bottom bar with the same four primary destinations as the desktop
 * sidebar, sized for comfortable tap targets.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LineChart, MessageCircle, UserRound } from "lucide-react";

const NAV_ITEMS = [
  { href: "/chat", label: "Chat", icon: MessageCircle, match: "/chat" },
  { href: "/plans", label: "Plans", icon: ClipboardList, match: "/plans" },
  { href: "/progress", label: "Progress", icon: LineChart, match: "/progress" },
  { href: "/onboarding", label: "Profile", icon: UserRound, match: "/onboarding" },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 backdrop-blur-md sm:hidden">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname?.startsWith(item.match);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${
              isActive ? "text-brand" : "text-muted-foreground"
            }`}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
