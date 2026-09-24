/**
 * log-weight-form.tsx — Logs a bodyweight entry directly via the RLS-scoped
 * browser Supabase client.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function LogWeightForm() {
  const router = useRouter();
  const supabase = createClient();
  const [weightKg, setWeightKg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedWeight = Number(weightKg);
    if (!parsedWeight) return;

    setIsSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("You're not signed in.");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase
      .from("body_metrics")
      .insert({ user_id: user.id, weight_kg: parsedWeight });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setWeightKg("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="weightKg">Log today&apos;s weight (kg)</Label>
        <Input
          id="weightKg"
          type="number"
          step="0.1"
          min={30}
          max={300}
          required
          value={weightKg}
          onChange={(e) => setWeightKg(e.target.value)}
          className="w-32"
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        Log
      </Button>
    </form>
  );
}
