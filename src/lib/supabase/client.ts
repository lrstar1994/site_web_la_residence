import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

export const futureSupabaseTables = [
  "rooms",
  "restaurant_menu",
  "events",
  "blog_posts",
  "products",
  "bookings",
] as const;
