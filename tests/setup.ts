// Vitest global setup. Currently a no-op — placeholder for future fixtures.
import { beforeAll } from "vitest";

beforeAll(() => {
  // Avoid accidental network calls in unit tests.
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  process.env.OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "";
});
