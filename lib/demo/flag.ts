/**
 * Single source of truth for "are we running without real backends?"
 *
 * When DEMO_MODE is enabled:
 *  - Supabase calls are intercepted and served from an in-memory store
 *  - Ollama calls return canned but realistic responses
 *  - A demo user is auto-signed-in
 *
 * Enable by setting `NEXT_PUBLIC_DEMO_MODE=1` in `.env.local`. We expose it as
 * a public var so client components can detect demo mode too (e.g. to show
 * banners or skip "save your work" warnings).
 */
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

export const DEMO_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "demo@vault.app",
} as const;
