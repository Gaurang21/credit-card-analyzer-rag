import { describe, it, expect } from "vitest";
import { CardInputSchema, ExtractedCardSchema } from "@/lib/cards/schema";

describe("CardInputSchema", () => {
  it("accepts a minimal manual card", () => {
    const result = CardInputSchema.safeParse({ name: "Test Card" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.annual_fee).toBe(0);
      expect(result.data.foreign_txn_fee_pct).toBe(0);
      expect(result.data.categories).toEqual([]);
    }
  });

  it("rejects last_four that is not exactly 4 digits", () => {
    const result = CardInputSchema.safeParse({ name: "x", last_four: "123" });
    expect(result.success).toBe(false);
  });

  it("treats empty last_four as allowed", () => {
    const result = CardInputSchema.safeParse({ name: "x", last_four: "" });
    expect(result.success).toBe(true);
  });

  it("rejects multipliers above 20", () => {
    const result = CardInputSchema.safeParse({
      name: "x",
      categories: [{ category: "dining", multiplier: 25 }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a full extracted card payload", () => {
    const result = ExtractedCardSchema.safeParse({
      name: "Sapphire Preferred",
      issuer: "Chase",
      network: "Visa",
      annual_fee: 95,
      foreign_txn_fee_pct: 0,
      signup_bonus: { points: 60000, spend_required: 4000, months: 3 },
      notes: "Travel benefits",
      categories: [
        { category: "travel", multiplier: 3, cap_amount: null, cap_period: null, notes: null },
        { category: "dining", multiplier: 2, cap_amount: null, cap_period: null, notes: null },
        { category: "flat", multiplier: 1, cap_amount: null, cap_period: null, notes: null },
      ],
    });
    expect(result.success).toBe(true);
  });
});
