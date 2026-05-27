import { describe, it, expect } from "vitest";
import { CARD_EXTRACTION_PROMPT, QUERY_INTENT_PROMPT, ADVISOR_PROMPT } from "@/lib/ollama/prompts";

describe("prompts", () => {
  it("extraction prompt enumerates required keys", () => {
    for (const key of ["name", "issuer", "network", "annual_fee", "foreign_txn_fee_pct", "categories"]) {
      expect(CARD_EXTRACTION_PROMPT).toContain(key);
    }
  });
  it("query intent prompt asks for required fields", () => {
    for (const key of ["merchant", "category", "amount", "is_international"]) {
      expect(QUERY_INTENT_PROMPT).toContain(key);
    }
  });
  it("advisor prompt requires the math be shown", () => {
    expect(ADVISOR_PROMPT.toLowerCase()).toContain("math");
  });
});
