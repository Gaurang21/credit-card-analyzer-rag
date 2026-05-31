import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { env, isSupabaseConfigured } from "@/lib/env";
import { DEMO_MODE } from "@/lib/demo/flag";
import { createFakeSupabase } from "@/lib/demo/supabase-fake";

const FALLBACK_URL = "https://invalid.supabase.co";
const FALLBACK_KEY = "invalid-anon-key";

type ServerClient = ReturnType<typeof createServerClient<Database>>;

export async function createSupabaseServerClient(): Promise<ServerClient> {
  if (DEMO_MODE) {
    return createFakeSupabase() as unknown as ServerClient;
  }
  const cookieStore = await cookies();
  const url = isSupabaseConfigured() ? env.NEXT_PUBLIC_SUPABASE_URL! : FALLBACK_URL;
  const anon = isSupabaseConfigured() ? env.NEXT_PUBLIC_SUPABASE_ANON_KEY! : FALLBACK_KEY;
  return createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
          }
        } catch {
          // setAll throws in server components — middleware handles refresh.
        }
      },
    },
  });
}

/**
 * Admin client that bypasses RLS. Use sparingly and only on server routes
 * where the caller is already authenticated and authorized.
 */
export function createSupabaseAdminClient() {
  if (DEMO_MODE) {
    return createFakeSupabase() as unknown as ReturnType<typeof createClient<Database>>;
  }
  const url = env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_KEY;
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
