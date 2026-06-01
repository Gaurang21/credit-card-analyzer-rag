import "server-only";
import { chatStream } from "@/lib/ai";
import { ADVISOR_PROMPT } from "@/lib/ollama/prompts";
import type { RetrievalResult } from "./retrieve-types";
import type { RankedCard } from "./rank";

export { rankCards, type RankedCard } from "./rank";

export function buildAdvisorMessages(query: string, retrieval: RetrievalResult, ranked: RankedCard[]) {
  const lines: string[] = [];
  lines.push(`User query: "${query}"`);
  lines.push(`Detected category: ${retrieval.resolvedCategory ?? "unknown"}`);
  if (retrieval.intent.amount != null) lines.push(`Amount: $${retrieval.intent.amount}`);
  if (retrieval.intent.merchant) lines.push(`Merchant: ${retrieval.intent.merchant}`);
  if (retrieval.merchantMatch)
    lines.push(
      `Merchant match: ${retrieval.merchantMatch.merchant} (sim ${retrieval.merchantMatch.similarity.toFixed(2)})`,
    );
  lines.push(`International: ${retrieval.intent.is_international}`);
  lines.push("");
  lines.push("User's cards (pre-computed best→worst by net value):");
  if (ranked.length === 0) {
    lines.push("- (no cards on file)");
  } else {
    for (const r of ranked.slice(0, 10)) {
      const cats =
        r.card.categories.map((c) => `${c.multiplier}x ${c.category}`).join(", ") ||
        "no rewards configured";
      lines.push(
        `- ${r.card.name}${r.card.issuer ? ` (${r.card.issuer})` : ""}: ${cats}; ` +
          `annual $${r.card.annual_fee ?? 0}; foreign ${r.card.foreign_txn_fee_pct ?? 0}%; ` +
          `applied ${r.appliedMultiplier}x → ${r.rewardPoints.toFixed(0)} pts ≈ $${r.cashValue.toFixed(2)}` +
          (r.foreignFeePenalty ? ` (− $${r.foreignFeePenalty.toFixed(2)} fee)` : "") +
          ` ⇒ net $${r.netValue.toFixed(2)}`,
      );
    }
  }
  return [
    { role: "system" as const, content: ADVISOR_PROMPT },
    { role: "user" as const, content: lines.join("\n") },
  ];
}

export async function* streamAdvisor(query: string, retrieval: RetrievalResult, ranked: RankedCard[]) {
  const messages = buildAdvisorMessages(query, retrieval, ranked);
  for await (const chunk of chatStream(messages, { temperature: 0.3 })) {
    yield chunk;
  }
}
