import "server-only";
import { embed } from "@/lib/ollama/client";
import { createSupabaseServerClient, createSupabaseAdminClient } from "@/lib/supabase/server";
import { detectIntent } from "./intent";
import type { RetrievedCard, RetrievalResult } from "./retrieve-types";

export type { RetrievedCard, RetrievalResult } from "./retrieve-types";

const MERCHANT_SIM_THRESHOLD = 0.7;

/**
 * Full retrieval pipeline for an advisor query:
 *  1. extract intent
 *  2. merchant -> category lookup via pgvector
 *  3. fetch all of the user's cards + their categories (we need math on all)
 *  4. semantic rank with match_user_cards as a secondary signal
 */
export async function retrieve(userId: string, query: string): Promise<RetrievalResult> {
  const intent = await detectIntent(query);

  // Merchant lookup
  let merchantMatch: RetrievalResult["merchantMatch"] = null;
  if (intent.merchant) {
    try {
      const merchantVec = await embed(intent.merchant);
      const admin = createSupabaseAdminClient();
      const { data } = await admin.rpc("match_merchant_category", {
        query_embedding: merchantVec,
        match_count: 1,
      });
      const top = data?.[0];
      if (top && top.similarity >= MERCHANT_SIM_THRESHOLD) {
        merchantMatch = { merchant: top.merchant, category: top.category, similarity: top.similarity };
      }
    } catch {
      // Tolerate vector lookup failures.
    }
  }
  const resolvedCategory = merchantMatch?.category ?? intent.category ?? null;

  // Cards
  const supa = await createSupabaseServerClient();
  const { data: cardRows } = await supa
    .from("cards")
    .select(
      "id,name,issuer,network,annual_fee,foreign_txn_fee_pct,notes,card_categories(category,multiplier,cap_amount,cap_period,notes)",
    );

  const cards: RetrievedCard[] = (cardRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    issuer: row.issuer,
    network: row.network,
    annual_fee: row.annual_fee,
    foreign_txn_fee_pct: row.foreign_txn_fee_pct,
    notes: row.notes,
    categories: (row.card_categories ?? []) as RetrievedCard["categories"],
  }));

  // Semantic ranking layered onto the existing list.
  try {
    const queryVec = await embed(query);
    const admin = createSupabaseAdminClient();
    const { data: ranked } = await admin.rpc("match_user_cards", {
      user_id_input: userId,
      query_embedding: queryVec,
      match_count: 10,
    });
    if (ranked) {
      const simByCard = new Map(ranked.map((r) => [r.card_id, r.similarity]));
      for (const c of cards) c.similarity = simByCard.get(c.id);
    }
  } catch {
    // ignore — we still have the raw cards.
  }

  return { intent, resolvedCategory, merchantMatch, cards };
}
