import "server-only";
import { embed } from "@/lib/ollama/client";
import { buildCardDoc } from "@/lib/cards/text";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { CardInput } from "@/lib/cards/schema";

/**
 * Embed a card and upsert into card_embeddings. We use the admin client
 * because the RLS policy on card_embeddings depends on the joined cards row,
 * which is harder to express across an upsert.
 */
export async function embedAndStoreCard(cardId: string, card: CardInput): Promise<void> {
  const doc = buildCardDoc(card);
  const vector = await embed(doc);
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("card_embeddings")
    .upsert({ card_id: cardId, embedding: vector, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Failed to store embedding: ${error.message}`);
}
