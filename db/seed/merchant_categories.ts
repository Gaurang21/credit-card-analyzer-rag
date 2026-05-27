/**
 * Seed script: embeds every merchant in `merchants.json` with nomic-embed-text
 * and upserts into `public.merchant_categories`.
 *
 * Usage:
 *   pnpm seed:merchants
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { embedBatch } from "@/lib/ollama/client";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MerchantSeed {
  merchant: string;
  category: string;
}

async function main() {
  const raw = await readFile(path.join(__dirname, "merchants.json"), "utf8");
  const merchants = JSON.parse(raw) as MerchantSeed[];
  console.log(`Seeding ${merchants.length} merchants…`);

  const texts = merchants.map((m) => `${m.merchant} — category: ${m.category}`);

  // Batch in chunks of 32 to keep payloads modest.
  const all: number[][] = [];
  for (let i = 0; i < texts.length; i += 32) {
    const slice = texts.slice(i, i + 32);
    const vecs = await embedBatch(slice);
    all.push(...vecs);
    console.log(`  embedded ${Math.min(i + 32, texts.length)}/${texts.length}`);
  }

  const admin = createSupabaseAdminClient();
  const rows = merchants.map((m, i) => ({ merchant: m.merchant, category: m.category, embedding: all[i] }));
  const { error } = await admin.from("merchant_categories").insert(rows);
  if (error) throw new Error(error.message);
  console.log("✅ Seeded merchant_categories");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
