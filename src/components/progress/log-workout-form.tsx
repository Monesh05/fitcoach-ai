/**
 * log-workout-form.tsx — Logs a completed exercise (for adherence + strength
 * progression tracking) directly via the RLS-scoped browser Supabase client.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function LogWorkoutForm() {
  const router = useRouter();
  const supabase = createClient();
  const [exerciseName, setExerciseName] = useState("");
  const [setsText, setSetsText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!exerciseName.trim()) return;

    setIsSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("You're not signed in.");
      setIsSubmitting(false);
      return;
    }

    const sets = setsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const { error } = await supabase.from("workout_logs").insert({
      user_id: user.id,
      exercise_name: exerciseName.trim(),
      sets,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setExerciseName("");
    setSetsText("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="exerciseName">Exercise</Label>
        <Input
          id="exerciseName"
          placeholder="e.g. Barbell squat"
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="setsText">Sets (one per line)</Label>
        <Textarea
          id="setsText"
          placeholder={"3x8 @ 60kg\n3x8 @ 62.5kg"}
          value={setsText}
          onChange={(e) => setSetsText(e.target.value)}
          className="min-h-16"
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        Log workout
      </Button>
    </form>
  );
}
