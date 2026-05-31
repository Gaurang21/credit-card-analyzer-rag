/**
 * In-memory data store for demo mode. Lives in a module-level Map so it
 * survives across requests within the same Next.js process (long enough for
 * a click-around demo). Each ID gets a stable UUID for predictable testing.
 */
import { DEMO_USER } from "./flag";

/** Universal UUID — works in both Node (>=19) and browser globals. */
function randomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for ancient runtimes — not cryptographically strong, fine for demo state.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface DemoCardRow {
  id: string;
  user_id: string;
  name: string;
  issuer: string | null;
  network: string | null;
  last_four: string | null;
  annual_fee: number | null;
  foreign_txn_fee_pct: number | null;
  signup_bonus: unknown;
  notes: string | null;
  created_at: string;
}

export interface DemoCategoryRow {
  id: string;
  card_id: string;
  category: string;
  multiplier: number;
  cap_amount: number | null;
  cap_period: string | null;
  notes: string | null;
}

export interface DemoQueryRow {
  id: string;
  user_id: string;
  query: string;
  response: unknown;
  created_at: string;
}

interface DemoState {
  cards: DemoCardRow[];
  categories: DemoCategoryRow[];
  queries: DemoQueryRow[];
}

const STATE: DemoState = { cards: [], categories: [], queries: [] };

const SEED: { card: Omit<DemoCardRow, "id" | "user_id" | "created_at">; categories: Omit<DemoCategoryRow, "id" | "card_id">[] }[] = [
  {
    card: {
      name: "Sapphire Preferred",
      issuer: "Chase",
      network: "Visa",
      last_four: "4242",
      annual_fee: 95,
      foreign_txn_fee_pct: 0,
      signup_bonus: { points: 60000, spend_required: 4000, months: 3 },
      notes: "1.25¢/pt redemption via Chase Travel",
    },
    categories: [
      { category: "travel", multiplier: 3, cap_amount: null, cap_period: null, notes: null },
      { category: "dining", multiplier: 2, cap_amount: null, cap_period: null, notes: null },
      { category: "streaming", multiplier: 3, cap_amount: null, cap_period: null, notes: null },
      { category: "flat", multiplier: 1, cap_amount: null, cap_period: null, notes: null },
    ],
  },
  {
    card: {
      name: "Amex Gold",
      issuer: "American Express",
      network: "Amex",
      last_four: "1009",
      annual_fee: 250,
      foreign_txn_fee_pct: 0,
      signup_bonus: { points: 60000, spend_required: 6000, months: 6 },
      notes: "$120/yr dining credit, $120/yr Uber credit",
    },
    categories: [
      { category: "dining", multiplier: 4, cap_amount: null, cap_period: null, notes: null },
      { category: "groceries", multiplier: 4, cap_amount: 25000, cap_period: "year", notes: null },
      { category: "flat", multiplier: 1, cap_amount: null, cap_period: null, notes: null },
    ],
  },
  {
    card: {
      name: "Freedom Unlimited",
      issuer: "Chase",
      network: "Visa",
      last_four: "7777",
      annual_fee: 0,
      foreign_txn_fee_pct: 3,
      signup_bonus: null,
      notes: null,
    },
    categories: [{ category: "flat", multiplier: 1.5, cap_amount: null, cap_period: null, notes: null }],
  },
  {
    card: {
      name: "Capital One Venture X",
      issuer: "Capital One",
      network: "Visa",
      last_four: "0001",
      annual_fee: 395,
      foreign_txn_fee_pct: 0,
      signup_bonus: { points: 75000, spend_required: 4000, months: 3 },
      notes: "$300 annual travel credit, 10k anniversary points",
    },
    categories: [
      { category: "travel", multiplier: 5, cap_amount: null, cap_period: null, notes: "on Capital One Travel" },
      { category: "flat", multiplier: 2, cap_amount: null, cap_period: null, notes: null },
    ],
  },
];

let SEEDED = false;
function ensureSeeded() {
  if (SEEDED) return;
  SEEDED = true;
  for (const item of SEED) {
    const id = randomUUID();
    STATE.cards.push({
      id,
      user_id: DEMO_USER.id,
      created_at: new Date(Date.now() - Math.random() * 30 * 86_400_000).toISOString(),
      ...item.card,
    });
    for (const c of item.categories) {
      STATE.categories.push({ id: randomUUID(), card_id: id, ...c });
    }
  }
}

export function listCards(): DemoCardRow[] {
  ensureSeeded();
  return [...STATE.cards].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export function getCard(id: string): DemoCardRow | undefined {
  ensureSeeded();
  return STATE.cards.find((c) => c.id === id);
}

export function listCategoriesFor(cardId: string): DemoCategoryRow[] {
  ensureSeeded();
  return STATE.categories.filter((c) => c.card_id === cardId);
}

export function insertCard(input: Omit<DemoCardRow, "id" | "user_id" | "created_at">): DemoCardRow {
  ensureSeeded();
  const row: DemoCardRow = {
    id: randomUUID(),
    user_id: DEMO_USER.id,
    created_at: new Date().toISOString(),
    ...input,
  };
  STATE.cards.unshift(row);
  return row;
}

export function insertCategories(cardId: string, rows: Omit<DemoCategoryRow, "id" | "card_id">[]) {
  ensureSeeded();
  for (const r of rows) {
    STATE.categories.push({ id: randomUUID(), card_id: cardId, ...r });
  }
}

export function deleteCard(id: string) {
  ensureSeeded();
  const i = STATE.cards.findIndex((c) => c.id === id);
  if (i >= 0) STATE.cards.splice(i, 1);
  for (let j = STATE.categories.length - 1; j >= 0; j--) {
    if (STATE.categories[j]!.card_id === id) STATE.categories.splice(j, 1);
  }
}

export function insertQuery(query: string, response: unknown): DemoQueryRow {
  ensureSeeded();
  const row: DemoQueryRow = {
    id: randomUUID(),
    user_id: DEMO_USER.id,
    query,
    response,
    created_at: new Date().toISOString(),
  };
  STATE.queries.unshift(row);
  return row;
}

export function listQueries(): DemoQueryRow[] {
  ensureSeeded();
  return [...STATE.queries];
}
