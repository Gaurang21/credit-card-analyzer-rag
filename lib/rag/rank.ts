/**
 * Pure deterministic ranker — no server-only deps so it's usable in evals,
 * unit tests, and the streaming advisor route alike.
 */
import type { RetrievalResult, RetrievedCard } from "./retrieve-types";

export interface RankedCard {
  card: RetrievedCard;
  baseMultiplier: number;
  appliedMultiplier: number;
  matchedCategory: string | null;
  rewardPoints: number;
  cashValue: number;
  foreignFeePenalty: number;
  netValue: number;
  warnings: string[];
}

const POINT_VALUE_DEFAULT = 0.01;
const POINT_VALUE_TRAVEL = 0.0125;

export function rankCards(retrieval: RetrievalResult): RankedCard[] {
  const amount = retrieval.intent.amount ?? 100;
  const category = retrieval.resolvedCategory;
  const intl = retrieval.intent.is_international;

  return retrieval.cards
    .map((card) => {
      const flatRow = card.categories.find((c) => c.category === "flat");
      const catRow = category ? card.categories.find((c) => c.category === category) : undefined;
      const matched = catRow ?? null;
      const baseMultiplier = flatRow?.multiplier ?? 1;
      const appliedMultiplier = matched?.multiplier ?? baseMultiplier;

      const isTravelCard = card.categories.some((c) => c.category === "travel" && c.multiplier > 1);
      const pointValue = isTravelCard ? POINT_VALUE_TRAVEL : POINT_VALUE_DEFAULT;

      const rewardPoints = appliedMultiplier * amount;
      const cashValue = rewardPoints * pointValue;

      const foreignFeePenalty =
        intl && card.foreign_txn_fee_pct ? (card.foreign_txn_fee_pct / 100) * amount : 0;
      const netValue = cashValue - foreignFeePenalty;

      const warnings: string[] = [];
      if (intl && card.foreign_txn_fee_pct && card.foreign_txn_fee_pct > 0) {
        warnings.push(`Foreign txn fee ${card.foreign_txn_fee_pct}% adds ~$${foreignFeePenalty.toFixed(2)}`);
      }
      if (matched?.cap_amount) {
        warnings.push(`Category cap: $${matched.cap_amount}${matched.cap_period ? `/${matched.cap_period}` : ""}`);
      }
      return {
        card,
        baseMultiplier,
        appliedMultiplier,
        matchedCategory: matched?.category ?? null,
        rewardPoints,
        cashValue,
        foreignFeePenalty,
        netValue,
        warnings,
      } satisfies RankedCard;
    })
    .sort((a, b) => b.netValue - a.netValue);
}
