import "server-only";
import { z } from "zod";
import { chat } from "@/lib/ollama/client";
import { QUERY_INTENT_PROMPT } from "@/lib/ollama/prompts";
import { extractJson } from "@/lib/ollama/extract-json";
import type { QueryIntent } from "./retrieve-types";

export const QueryIntentSchema = z.object({
  merchant: z.string().nullable(),
  category: z.string().nullable(),
  amount: z.number().nullable(),
  location: z.string().nullable(),
  is_international: z.boolean(),
});
export type { QueryIntent } from "./retrieve-types";

export async function detectIntent(query: string): Promise<QueryIntent> {
  const raw = await chat(
    [
      { role: "system", content: QUERY_INTENT_PROMPT },
      { role: "user", content: query },
    ],
    { temperature: 0.1, format: "json" },
  );
  const parsed = extractJson(raw);
  // Be permissive: coerce sloppy fields back to schema defaults.
  const safe = QueryIntentSchema.safeParse(parsed);
  if (safe.success) return safe.data;
  return {
    merchant: null,
    category: null,
    amount: null,
    location: null,
    is_international: false,
  };
}
