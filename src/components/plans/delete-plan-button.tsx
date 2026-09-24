/**
 * delete-plan-button.tsx — Deletes a saved plan via the RLS-scoped browser
 * Supabase client.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function DeletePlanButton({ planId }: { planId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    setIsDeleting(true);
    const { error } = await supabase.from("generated_plans").delete().eq("id", planId);
    setIsDeleting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Delete plan"
      disabled={isDeleting}
      onClick={handleDelete}
    >
      <Trash2 className="size-4 text-destructive" />
    </Button>
  );
}
