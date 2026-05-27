import { describe, it, expect } from "vitest";
import { rankCards } from "@/lib/rag/rank";
import type { RetrievalResult } from "@/lib/rag/retrieve-types";

function card(name: string, opts: Partial<RetrievalResult["cards"][number]> = {}): RetrievalResult["cards"][number] {
  return {
    id: name,
    name,
    issuer: null,
    network: null,
    annual_fee: 0,
    foreign_txn_fee_pct: 0,
    notes: null,
    categories: [{ category: "flat", multiplier: 1, cap_amount: null, cap_period: null, notes: null }],
    ...opts,
  };
}

describe("rankCards", () => {
  it("ranks the best multiplier first when no international flag", () => {
    const retrieval: RetrievalResult = {
      intent: { merchant: null, category: null, amount: 1000, location: null, is_international: false },
      resolvedCategory: "travel",
      merchantMatch: null,
      cards: [
        card("Sapphire Preferred", {
          categories: [
            { category: "travel", multiplier: 3, cap_amount: null, cap_period: null, notes: null },
            { category: "flat", multiplier: 1, cap_amount: null, cap_period: null, notes: null },
          ],
        }),
        card("Freedom Unlimited", {
          categories: [{ category: "flat", multiplier: 1.5, cap_amount: null, cap_period: null, notes: null }],
        }),
      ],
    };
    const ranked = rankCards(retrieval);
    expect(ranked[0]!.card.name).toBe("Sapphire Preferred");
    expect(ranked[0]!.appliedMultiplier).toBe(3);
    // Travel card uses 1.25c/pt
    expect(ranked[0]!.cashValue).toBeCloseTo(3 * 1000 * 0.0125);
  });

  it("penalizes foreign txn fees on international purchases", () => {
    const retrieval: RetrievalResult = {
      intent: { merchant: null, category: null, amount: 1000, location: "Japan", is_international: true },
      resolvedCategory: null,
      merchantMatch: null,
      cards: [
        card("No FTF Card", {
          foreign_txn_fee_pct: 0,
          categories: [
            { category: "travel", multiplier: 2, cap_amount: null, cap_period: null, notes: null },
            { category: "flat", multiplier: 1, cap_amount: null, cap_period: null, notes: null },
          ],
        }),
        card("3% FTF Card", {
          foreign_txn_fee_pct: 3,
          categories: [
            { category: "travel", multiplier: 3, cap_amount: null, cap_period: null, notes: null },
            { category: "flat", multiplier: 1, cap_amount: null, cap_period: null, notes: null },
          ],
        }),
      ],
    };
    const ranked = rankCards(retrieval);
    expect(ranked[0]!.card.name).toBe("No FTF Card");
    expect(ranked[1]!.foreignFeePenalty).toBe(30);
  });

  it("falls back to flat multiplier when category unknown", () => {
    const retrieval: RetrievalResult = {
      intent: { merchant: null, category: null, amount: 100, location: null, is_international: false },
      resolvedCategory: "unknown_category",
      merchantMatch: null,
      cards: [
        card("FlatTwoX", { categories: [{ category: "flat", multiplier: 2, cap_amount: null, cap_period: null, notes: null }] }),
      ],
    };
    const ranked = rankCards(retrieval);
    expect(ranked[0]!.appliedMultiplier).toBe(2);
    expect(ranked[0]!.matchedCategory).toBeNull();
  });
});
