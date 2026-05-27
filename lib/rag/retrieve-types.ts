/** Pure types shared by retrieval and ranking. No server-only imports here. */

export interface QueryIntent {
  merchant: string | null;
  category: string | null;
  amount: number | null;
  location: string | null;
  is_international: boolean;
}

export interface RetrievedCard {
  id: string;
  name: string;
  issuer: string | null;
  network: string | null;
  annual_fee: number | null;
  foreign_txn_fee_pct: number | null;
  notes: string | null;
  categories: {
    category: string;
    multiplier: number;
    cap_amount: number | null;
    cap_period: string | null;
    notes: string | null;
  }[];
  similarity?: number;
}

export interface RetrievalResult {
  intent: QueryIntent;
  resolvedCategory: string | null;
  merchantMatch: { merchant: string; category: string; similarity: number } | null;
  cards: RetrievedCard[];
}
