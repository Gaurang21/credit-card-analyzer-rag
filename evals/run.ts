/**
 * Eval harness: runs the deterministic ranker against canned wallets and
 * scores top-1 match against `expected_top`. Does NOT call the LLM — it scores
 * the math/RAG layer, which is what we control.
 *
 *   pnpm evals
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rankCards } from "@/lib/rag/rank";
import type { RetrievalResult, RetrievedCard } from "@/lib/rag/retrieve-types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Case {
  query: string;
  expected_category: string | null;
  expected_amount: number;
  expected_international?: boolean;
  wallet: Array<{
    name: string;
    annual_fee?: number;
    foreign_txn_fee_pct?: number;
    categories: Array<{ category: string; multiplier: number; cap_amount?: number | null; cap_period?: string | null }>;
  }>;
  expected_top: string;
}

function buildRetrieval(c: Case): RetrievalResult {
  const cards: RetrievedCard[] = c.wallet.map((w, i) => ({
    id: `${i}`,
    name: w.name,
    issuer: null,
    network: null,
    annual_fee: w.annual_fee ?? 0,
    foreign_txn_fee_pct: w.foreign_txn_fee_pct ?? 0,
    notes: null,
    categories: w.categories.map((cat) => ({
      category: cat.category,
      multiplier: cat.multiplier,
      cap_amount: cat.cap_amount ?? null,
      cap_period: cat.cap_period ?? null,
      notes: null,
    })),
  }));
  return {
    intent: {
      merchant: null,
      category: c.expected_category,
      amount: c.expected_amount,
      location: null,
      is_international: c.expected_international ?? false,
    },
    resolvedCategory: c.expected_category,
    merchantMatch: null,
    cards,
  };
}

async function main() {
  const raw = await readFile(path.join(__dirname, "cases.json"), "utf8");
  const cases = JSON.parse(raw) as Case[];

  let pass = 0;
  const failures: { i: number; query: string; expected: string; got: string }[] = [];

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i]!;
    const ranked = rankCards(buildRetrieval(c));
    const top = ranked[0]?.card.name;
    if (top === c.expected_top) {
      pass++;
    } else {
      failures.push({ i, query: c.query, expected: c.expected_top, got: top ?? "(none)" });
    }
  }

  console.log(`\nPassed ${pass}/${cases.length}`);
  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) {
      console.log(`  [${f.i}] "${f.query}"\n    expected: ${f.expected}\n    got:      ${f.got}`);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
