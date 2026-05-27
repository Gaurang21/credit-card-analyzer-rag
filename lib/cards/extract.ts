import "server-only";
import { chat } from "@/lib/ollama/client";
import { CARD_EXTRACTION_PROMPT } from "@/lib/ollama/prompts";
import { extractJson } from "@/lib/ollama/extract-json";
import { ExtractedCardSchema, type ExtractedCard } from "./schema";

/**
 * Run the card-extraction LLM call against raw text (from a web fetch or PDF),
 * parse the JSON, and validate against the strict schema.
 * Caller is responsible for showing the result to the user for confirmation
 * before persisting.
 */
export async function extractCardFromText(rawText: string, hint?: string): Promise<ExtractedCard> {
  const trimmed = rawText.slice(0, 18_000); // soft cap to stay under context
  const userMsg = hint ? `Hint: ${hint}\n\nText:\n${trimmed}` : trimmed;

  const raw = await chat(
    [
      { role: "system", content: CARD_EXTRACTION_PROMPT },
      { role: "user", content: userMsg },
    ],
    { temperature: 0.1, format: "json" },
  );
  const parsed = extractJson(raw);
  return ExtractedCardSchema.parse(parsed);
}
