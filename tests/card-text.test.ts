import { describe, it, expect } from "vitest";
import { buildCardDoc, htmlToCleanText } from "@/lib/cards/text";

describe("buildCardDoc", () => {
  it("includes name, fees, and rewards", () => {
    const doc = buildCardDoc({
      name: "Sapphire Preferred",
      issuer: "Chase",
      network: "Visa",
      annual_fee: 95,
      foreign_txn_fee_pct: 0,
      signup_bonus: { points: 60000, spend_required: 4000, months: 3 },
      notes: null,
      last_four: null,
      categories: [
        { category: "travel", multiplier: 3, cap_amount: null, cap_period: null, notes: null },
        { category: "dining", multiplier: 2, cap_amount: null, cap_period: null, notes: null },
      ],
    });
    expect(doc).toContain("Sapphire Preferred");
    expect(doc).toContain("by Chase");
    expect(doc).toContain("Annual fee: $95");
    expect(doc).toContain("Foreign transaction fee: 0%");
    expect(doc).toContain("3x on travel");
    expect(doc).toContain("60,000 pts");
  });

  it("handles cards with caps", () => {
    const doc = buildCardDoc({
      name: "Custom Cash",
      issuer: "Citi",
      network: null,
      annual_fee: 0,
      foreign_txn_fee_pct: 3,
      signup_bonus: null,
      notes: null,
      last_four: null,
      categories: [{ category: "dining", multiplier: 5, cap_amount: 500, cap_period: "month", notes: null }],
    });
    expect(doc).toContain("cap $500/month");
  });
});

describe("htmlToCleanText", () => {
  it("strips scripts, styles, and tags", () => {
    const html =
      '<html><head><style>.x{color:red}</style></head><body><script>evil()</script><p>Hello <b>world</b></p></body></html>';
    const out = htmlToCleanText(html);
    expect(out).not.toContain("evil");
    expect(out).not.toContain("<");
    expect(out).toContain("Hello world");
  });

  it("respects max length", () => {
    const html = "<p>" + "a".repeat(50_000) + "</p>";
    const out = htmlToCleanText(html, 100);
    expect(out.length).toBeLessThanOrEqual(100);
  });
});
