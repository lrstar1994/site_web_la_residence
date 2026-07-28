"use server";

import { redirect } from "next/navigation";
import { getAdminLoginPath } from "@/lib/auth/admin-paths";
import type { Locale } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signOutAdmin(locale: Locale) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("[admin] Sign-out failed:", error.message);
  }

  redirect(getAdminLoginPath(locale));
}
