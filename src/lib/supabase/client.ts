import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function getSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createSupabaseBrowserClient();
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
