"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !anon) {
    // We still return a client to keep the type stable; calls will fail at runtime
    // with a clear error so the UI can show a setup banner.
    return createBrowserClient<Database>("https://invalid.supabase.co", "invalid-anon-key");
  }
  return createBrowserClient<Database>(url, anon);
}
