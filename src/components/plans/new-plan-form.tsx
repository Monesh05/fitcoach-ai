/**
 * new-plan-form.tsx — Requests a new AI-generated plan and redirects to it.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function NewPlanForm() {
  const router = useRouter();
  const [focus, setFocus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus: focus.trim() || undefined }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to generate plan.");
      }

      const { id } = await response.json();
      router.push(`/plans/${id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="focus">Anything specific for this plan? (optional)</Label>
        <Textarea
          id="focus"
          value={focus}
          onChange={(e) => setFocus(e.target.value)}
          placeholder="e.g. Focus on upper body, I have limited gym time this week"
          className="min-h-20"
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Generating... (can take up to a minute)" : "Generate plan"}
      </Button>
    </form>
  );
}
