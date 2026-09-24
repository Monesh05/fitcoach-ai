/**
 * eval-user.ts — Resolves the Supabase auth user the eval suite runs
 * against, so every eval script shares one lookup instead of repeating it.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-20
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getEvalUser(supabase: SupabaseClient): Promise<{ id: string; email: string }> {
  const email = process.env.EVAL_USER_EMAIL;
  if (!email) {
    throw new Error(
      "Set EVAL_USER_EMAIL in .env.local to an existing, onboarded account to run evals against.",
    );
  }

  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;

  const user = data.users.find((u) => u.email === email);
  if (!user) {
    throw new Error(`No user found with email ${email}.`);
  }

  return { id: user.id, email: user.email ?? email };
}
