/** Build the canonical text doc that gets embedded for RAG. */
import type { CardInput } from "./schema";

export function buildCardDoc(card: CardInput): string {
  const parts: string[] = [];
  parts.push(`${card.name}${card.issuer ? ` by ${card.issuer}` : ""}.`);
  if (card.network) parts.push(`Network: ${card.network}.`);
  parts.push(`Annual fee: $${card.annual_fee ?? 0}.`);
  parts.push(`Foreign transaction fee: ${card.foreign_txn_fee_pct ?? 0}%.`);

  if (card.categories.length > 0) {
    const rewards = card.categories
      .map((c) => {
        const cap = c.cap_amount ? ` (cap $${c.cap_amount}${c.cap_period ? `/${c.cap_period}` : ""})` : "";
        return `${c.multiplier}x on ${c.category}${cap}`;
      })
      .join(", ");
    parts.push(`Rewards: ${rewards}.`);
  } else {
    parts.push("Rewards: not specified.");
  }

  if (card.signup_bonus) {
    parts.push(
      `Sign-up bonus: ${card.signup_bonus.points.toLocaleString()} pts after $${card.signup_bonus.spend_required.toLocaleString()} in ${card.signup_bonus.months} months.`,
    );
  }
  if (card.notes) parts.push(`Notes: ${card.notes}`);

  return parts.join(" ");
}

/** Sanitize HTML coming from a web fetch into clean text for the LLM. */
export function htmlToCleanText(html: string, maxChars = 18_000): string {
  // Strip script/style fully.
  let s = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  // Replace br/p/div with newlines.
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<\/(p|div|li|h[1-6])>/gi, "\n");
  // Strip all remaining tags.
  s = s.replace(/<[^>]+>/g, " ");
  // Collapse entities (common ones) and whitespace.
  s = s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"');
  s = s.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return s.slice(0, maxChars);
}
