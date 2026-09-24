/**
 * auth.ts — Request-memoized auth lookup so layout + page server components
 * that both need the current user don't each pay a separate network round
 * trip to Supabase Auth for the same request.
 * Author: Monesh Abinav <monesh.abinav@vigilnz.com>
 * Date: 2026-09-24
 */
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getAuthedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
