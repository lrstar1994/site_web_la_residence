"use server";

import { redirect } from "next/navigation";
import { getAdminPath } from "@/lib/auth/admin-paths";
import type { Locale } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SignInState = {
  error?: string;
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function signInAdmin(
  locale: Locale,
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (
    !email ||
    !password ||
    email.length > 254 ||
    password.length > 200 ||
    !isValidEmail(email)
  ) {
    return { error: "invalid_credentials" };
  }

  const supabase = await createSupabaseServerClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: "invalid_credentials" };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    await supabase.auth.signOut();
    return { error: "invalid_credentials" };
  }

  const { data, error: adminError } = await supabase
    .schema("site")
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (adminError) {
    console.error("[admin] Sign-in access check failed:", adminError.message);
  }

  if (adminError || !data) {
    await supabase.auth.signOut();
    return { error: "invalid_credentials" };
  }

  redirect(getAdminPath(locale));
}
