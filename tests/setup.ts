import { beforeAll, afterEach, vi } from "vitest";

// Vitest 2 prefers `vi` over `jest`; jest-dom matchers extend expect automatically.
import "@testing-library/jest-dom/vitest";

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  process.env.OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "";
});

afterEach(() => {
  vi.restoreAllMocks();
});
