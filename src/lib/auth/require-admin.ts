import "server-only";

import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { getAdminLoginPath } from "@/lib/auth/admin-paths";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminRole = "admin" | "editor";

export type AdminUser = {
  id: string;
  email: string | null;
  role: AdminRole;
};

type AdminAccessRow = {
  role: AdminRole;
};

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .schema("site")
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("[admin] Unable to verify admin access:", error.message);
    return null;
  }

  const adminAccess = data as AdminAccessRow | null;

  if (!adminAccess) {
    await supabase.auth.signOut();
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    role: adminAccess.role,
  };
}

export async function requireAdmin(locale: Locale) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect(getAdminLoginPath(locale));
  }

  return admin;
}
