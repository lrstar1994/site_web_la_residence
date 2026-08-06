"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function removeUploadedImages({
  supabaseClient,
  bucket,
  storagePaths,
}: {
  supabaseClient: SupabaseClient;
  bucket: string;
  storagePaths: string[];
}) {
  const uniquePaths = [...new Set(storagePaths.filter((path) => path.length > 0))];
  if (uniquePaths.length === 0) return { ok: true as const };

  const { error } = await supabaseClient.storage.from(bucket).remove(uniquePaths);

  if (error) {
    return { ok: false as const, message: error.message };
  }

  return { ok: true as const };
}
