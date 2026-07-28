import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function ensureAdminReadContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("[admin-read] Auth user lookup failed:", userError.message);
    throw new Error("ADMIN_AUTH_LOOKUP_FAILED");
  }

  if (!user) {
    throw new Error("ADMIN_AUTH_REQUIRED");
  }

  const { data, error } = await supabase
    .schema("site")
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[admin-read] Admin access lookup failed:", error.message);
    throw new Error("ADMIN_ACCESS_LOOKUP_FAILED");
  }

  if (!data) {
    throw new Error("ADMIN_ACCESS_REQUIRED");
  }
}
