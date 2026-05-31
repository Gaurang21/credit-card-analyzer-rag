"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { DEMO_MODE } from "@/lib/demo/flag";
import { createFakeSupabase } from "@/lib/demo/supabase-fake";

type Client = ReturnType<typeof createBrowserClient<Database>>;

export function createSupabaseBrowserClient(): Client {
  if (DEMO_MODE) {
    return createFakeSupabase() as unknown as Client;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !anon) {
    return createBrowserClient<Database>("https://invalid.supabase.co", "invalid-anon-key");
  }
  return createBrowserClient<Database>(url, anon);
}
