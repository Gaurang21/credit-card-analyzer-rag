/**
 * Canned LLM responses for demo mode. Deterministic, no network, no model.
 *
 * Strategy:
 *  - Card extraction: return a generic mid-tier card so the confirm step has
 *    something to show.
 *  - Query intent: keyword-match the user's question for merchant/amount/intl.
 *  - Advisor stream: walk the pre-computed ranked list and emit a markdown
 *    explanation chunk-by-chunk so the UI's streaming code path is exercised.
 *  - Embeddings: stable 768-dim vectors derived from a hash of the text.
 */
import type { ChatMessage } from "@/lib/ollama/client";

const TIPS = {
  travel: "no foreign txn fees on this card",
  dining: "bonus categories stack with dining apps",
  groceries: "Whole Foods + Amazon Fresh count",
  streaming: "annual streaming credit may apply",
} as const;

export function fakeCardExtraction(): string {
  return JSON.stringify({
    name: "Sample Issuer Premium Card",
    issuer: "Sample Issuer",
    network: "Visa",
    annual_fee: 95,
    foreign_txn_fee_pct: 0,
    signup_bonus: { points: 50000, spend_required: 3000, months: 3 },
    notes: "Demo extraction — edit any field before saving.",
    categories: [
      { category: "travel", multiplier: 3, cap_amount: null, cap_period: null, notes: null },
      { category: "dining", multiplier: 2, cap_amount: null, cap_period: null, notes: null },
      { category: "flat", multiplier: 1, cap_amount: null, cap_period: null, notes: null },
    ],
  });
}

export function fakeQueryIntent(query: string): string {
  const lower = query.toLowerCase();
  const amount = lower.match(/\$?\s?([0-9][0-9,]*(?:\.[0-9]+)?)\s?(k|thousand)?/);
  let parsedAmount: number | null = null;
  if (amount?.[1]) {
    const raw = Number(amount[1].replace(/,/g, ""));
    parsedAmount = amount[2] ? raw * 1000 : raw;
  }
  const merchant = (() => {
    const known = [
      "Apple Store",
      "Whole Foods",
      "Costco",
      "Amazon",
      "Marriott",
      "United Airlines",
      "Delta",
      "Uber",
      "Shell",
      "DoorDash",
      "Netflix",
    ];
    for (const m of known) if (lower.includes(m.toLowerCase())) return m;
    if (/macbook|iphone|ipad/.test(lower)) return "Apple Store";
    return null;
  })();
  const category = (() => {
    if (/travel|flight|hotel|airline|airbnb/.test(lower)) return "travel";
    if (/dinner|dining|restaurant|steakhouse|takeout/.test(lower)) return "dining";
    if (/grocer|whole foods|trader joe/.test(lower)) return "groceries";
    if (/gas|fuel|shell|chevron/.test(lower)) return "gas";
    if (/macbook|iphone|electronics|laptop|monitor/.test(lower)) return "electronics";
    if (/netflix|spotify|streaming|subscription/.test(lower)) return "streaming";
    if (/costco|sam'?s club|bj'?s/.test(lower)) return "warehouse_club";
    return null;
  })();
  const isIntl = /japan|tokyo|paris|london|abroad|international|overseas|europe/.test(lower);
  return JSON.stringify({
    merchant,
    category,
    amount: parsedAmount,
    location: isIntl ? "International" : null,
    is_international: isIntl,
  });
}

export function fakeAdvisorAnswer(messages: ChatMessage[]): string {
  // The advisor route builds a user message that already contains the ranked
  // list with the math. Mine it for the winning card name to make the canned
  // text feel personalized.
  const userMsg = messages.find((m) => m.role === "user")?.content ?? "";
  const ranked = userMsg.match(/- ([^:]+):.*applied ([\d.]+)x.*pts.*net \$([\d.]+)/);
  if (!ranked) {
    return "I couldn't find any cards in your wallet — add one to get a real recommendation.";
  }
  const [, name, mult, net] = ranked;
  const catMatch = userMsg.match(/Detected category: (\S+)/);
  const cat = catMatch?.[1] ?? "this purchase";
  const tipKey = cat as keyof typeof TIPS;
  const tip = TIPS[tipKey];
  return `**${name}** is the best choice. It earns ${mult}× on ${cat}, which lands at about $${net} of net value after fees.\n\n${tip ? `• ${tip}\n` : ""}• Math is shown in the receipt above.\n\n_(This is a canned demo answer — wire up Ollama or Groq to get the real LLM.)_`;
}

export async function* fakeAdvisorStream(messages: ChatMessage[]): AsyncGenerator<string> {
  const text = fakeAdvisorAnswer(messages);
  // Stream ~6 chars at a time with a 12ms gap so the UI's progressive render
  // gets exercised.
  for (let i = 0; i < text.length; i += 6) {
    yield text.slice(i, i + 6);
    await new Promise((r) => setTimeout(r, 12));
  }
}

/**
 * Deterministic 768-dim "embedding" — not semantically meaningful, but stable
 * so the merchant→category vector RPC behaves predictably. Demo mode skips
 * the RPC entirely so this is only used to satisfy the call shape.
 */
export function fakeEmbedding(text: string): number[] {
  const out = new Array<number>(768);
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  for (let i = 0; i < 768; i++) {
    h = Math.imul(h ^ i, 2654435761) >>> 0;
    out[i] = ((h & 0xffff) / 0xffff) * 2 - 1;
  }
  return out;
}
