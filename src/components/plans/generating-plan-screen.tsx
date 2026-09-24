/**
 * generating-plan-screen.tsx — Full-screen animated status while the first
 * plan is generated right after onboarding, then hands off to the plan view.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const STATUS_MESSAGES = [
  "Reading your profile...",
  "Grounding training advice in the knowledge base...",
  "Building your weekly training split...",
  "Calculating your calorie and macro targets...",
  "Putting together a sample meal plan...",
];

export function GeneratingPlanScreen() {
  const router = useRouter();
  const [statusIndex, setStatusIndex] = useState(0);
  const [phase, setPhase] = useState<"generating" | "done" | "error">("generating");
  const hasStarted = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    (async () => {
      try {
        const response = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? "Failed to generate plan.");
        }

        const { id } = await response.json();
        setPhase("done");
        setTimeout(() => router.push(`/plans/${id}?new=1`), 900);
      } catch (error) {
        setPhase("error");
        toast.error(error instanceof Error ? error.message : "Something went wrong.");
      }
    })();
  }, [router]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-4 text-center">
      {phase === "generating" && (
        <>
          <Loader2 className="size-10 animate-spin text-primary" />
          <div>
            <h1 className="text-lg font-semibold">Building your first plan</h1>
            <p className="mt-2 text-sm text-muted-foreground transition-opacity">
              {STATUS_MESSAGES[statusIndex]}
            </p>
          </div>
        </>
      )}

      {phase === "done" && (
        <>
          <CheckCircle2 className="size-10 text-primary" />
          <h1 className="text-lg font-semibold">Your plan is ready!</h1>
        </>
      )}

      {phase === "error" && (
        <>
          <h1 className="text-lg font-semibold">Couldn&apos;t generate a plan</h1>
          <p className="text-sm text-muted-foreground">
            Something went wrong talking to the model. You can try again.
          </p>
          <Button onClick={() => router.push("/plans/new")}>Try again</Button>
        </>
      )}
    </div>
  );
}
