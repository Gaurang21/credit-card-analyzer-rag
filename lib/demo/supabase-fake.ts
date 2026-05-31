/**
 * A thin chainable fake of the subset of the supabase-js client we actually
 * touch. Backed by `lib/demo/store.ts`. Returns identical-shape responses
 * (`{ data, error }`) so callers don't need DEMO_MODE conditionals.
 *
 * Not a drop-in for arbitrary queries — only the patterns we use:
 *   from("table").select(cols).order().limit().eq().single()/maybeSingle()
 *   from("table").insert(rows).select(cols).single()  // returns data: { id }
 *   from("table").delete().eq(col, val)
 *   from("table").upsert(...)                         // no-op
 *   rpc(name, args)                                   // returns []
 */
import { DEMO_USER } from "./flag";
import {
  deleteCard,
  insertCard,
  insertCategories,
  insertQuery,
  listCards,
  listCategoriesFor,
  listQueries,
  type DemoCardRow,
  type DemoCategoryRow,
} from "./store";

type Result<T> = { data: T; error: null } | { data: null; error: { message: string } };
type Row = Record<string, unknown>;

interface ChainState {
  table: string;
  selectCols: string | null;
  eqFilters: Array<[string, unknown]>;
  orderCol: string | null;
  orderAsc: boolean;
  limitN: number | null;
  pendingInsertRows: Row[] | null;
  pendingDelete: boolean;
}

function newState(table: string): ChainState {
  return {
    table,
    selectCols: null,
    eqFilters: [],
    orderCol: null,
    orderAsc: true,
    limitN: null,
    pendingInsertRows: null,
    pendingDelete: false,
  };
}

function rowsForTable(state: ChainState): Row[] {
  switch (state.table) {
    case "cards": {
      const rows = listCards().map((c) => attachJoinedCategories(c, state.selectCols));
      return applyFilters(rows, state);
    }
    case "card_categories":
      // Only used for insert in our codebase.
      return [];
    case "advisor_queries":
      return applyFilters(listQueries() as unknown as Row[], state);
    case "card_embeddings":
      return [];
    default:
      return [];
  }
}

function attachJoinedCategories(card: DemoCardRow, selectCols: string | null): Row {
  if (selectCols && /card_categories/.test(selectCols)) {
    return { ...card, card_categories: listCategoriesFor(card.id) as unknown as Row[] };
  }
  return { ...card };
}

function applyFilters(rows: Row[], state: ChainState): Row[] {
  let out = rows;
  for (const [col, val] of state.eqFilters) {
    out = out.filter((r) => r[col] === val);
  }
  if (state.orderCol) {
    const col = state.orderCol;
    const asc = state.orderAsc;
    out = [...out].sort((a, b) => {
      const av = a[col] as string | number;
      const bv = b[col] as string | number;
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return asc ? cmp : -cmp;
    });
  }
  if (state.limitN != null) out = out.slice(0, state.limitN);
  return out;
}

interface ThenableChain<T> extends PromiseLike<T> {
  select(cols?: string): ThenableChain<T>;
  eq(col: string, val: unknown): ThenableChain<T>;
  order(col: string, opts?: { ascending?: boolean }): ThenableChain<T>;
  limit(n: number): ThenableChain<T>;
  single(): Promise<Result<Row | null>>;
  maybeSingle(): Promise<Result<Row | null>>;
}

function makeChain(state: ChainState): ThenableChain<Result<Row[]>> {
  const exec = (): Result<Row[]> => {
    try {
      if (state.pendingInsertRows) {
        return performInsert(state);
      }
      if (state.pendingDelete) {
        return performDelete(state);
      }
      return { data: rowsForTable(state), error: null };
    } catch (e) {
      return { data: null, error: { message: (e as Error).message } } as Result<Row[]>;
    }
  };

  const chain: ThenableChain<Result<Row[]>> = {
    select(cols) {
      state.selectCols = cols ?? "*";
      return chain;
    },
    eq(col, val) {
      state.eqFilters.push([col, val]);
      return chain;
    },
    order(col, opts) {
      state.orderCol = col;
      state.orderAsc = opts?.ascending ?? true;
      return chain;
    },
    limit(n) {
      state.limitN = n;
      return chain;
    },
    async single() {
      const res = exec();
      if (res.error) return res as Result<null>;
      const row = (res.data as Row[])[0];
      if (!row) return { data: null, error: { message: "No rows" } };
      return { data: row, error: null };
    },
    async maybeSingle() {
      const res = exec();
      if (res.error) return res as Result<null>;
      return { data: ((res.data as Row[])[0] ?? null) as Row | null, error: null };
    },
    then(onFulfilled, onRejected) {
      return Promise.resolve(exec()).then(onFulfilled, onRejected);
    },
  };
  return chain;
}

function performInsert(state: ChainState): Result<Row[]> {
  const rows = state.pendingInsertRows!;
  if (state.table === "cards") {
    const inserted = rows.map((r) =>
      insertCard({
        name: String(r.name),
        issuer: (r.issuer as string | null) ?? null,
        network: (r.network as string | null) ?? null,
        last_four: (r.last_four as string | null) ?? null,
        annual_fee: (r.annual_fee as number | null) ?? 0,
        foreign_txn_fee_pct: (r.foreign_txn_fee_pct as number | null) ?? 0,
        signup_bonus: r.signup_bonus ?? null,
        notes: (r.notes as string | null) ?? null,
      }),
    );
    return { data: inserted as unknown as Row[], error: null };
  }
  if (state.table === "card_categories") {
    const byCard = new Map<string, Omit<DemoCategoryRow, "id" | "card_id">[]>();
    for (const r of rows) {
      const cardId = String(r.card_id);
      const arr = byCard.get(cardId) ?? [];
      arr.push({
        category: String(r.category),
        multiplier: Number(r.multiplier),
        cap_amount: (r.cap_amount as number | null) ?? null,
        cap_period: (r.cap_period as string | null) ?? null,
        notes: (r.notes as string | null) ?? null,
      });
      byCard.set(cardId, arr);
    }
    for (const [cardId, arr] of byCard) insertCategories(cardId, arr);
    return { data: rows as Row[], error: null };
  }
  if (state.table === "advisor_queries") {
    const inserted = rows.map((r) =>
      insertQuery(String(r.query), r.response),
    );
    return { data: inserted as unknown as Row[], error: null };
  }
  if (state.table === "card_embeddings") {
    return { data: [], error: null };
  }
  return { data: null, error: { message: `unsupported insert: ${state.table}` } };
}

function performDelete(state: ChainState): Result<Row[]> {
  if (state.table !== "cards") return { data: [], error: null };
  for (const [col, val] of state.eqFilters) {
    if (col === "id") {
      deleteCard(String(val));
    }
  }
  return { data: [], error: null };
}

function makeTable(table: string) {
  return {
    select(cols?: string) {
      const s = newState(table);
      s.selectCols = cols ?? "*";
      return makeChain(s);
    },
    insert(rows: Row | Row[]) {
      const s = newState(table);
      s.pendingInsertRows = Array.isArray(rows) ? rows : [rows];
      return makeChain(s);
    },
    upsert(_rows: Row | Row[]) {
      const s = newState(table);
      return makeChain(s);
    },
    delete() {
      const s = newState(table);
      s.pendingDelete = true;
      return makeChain(s);
    },
  };
}

/** Returns the demo user, always — demo mode is a single-user sandbox. */
const fakeAuth = {
  async getUser() {
    return { data: { user: { id: DEMO_USER.id, email: DEMO_USER.email } }, error: null };
  },
  async signInWithPassword(_creds: { email: string; password: string }) {
    return { data: { session: { access_token: "demo" }, user: DEMO_USER }, error: null };
  },
  async signUp(_creds: { email: string; password: string }) {
    return { data: { session: { access_token: "demo" }, user: DEMO_USER }, error: null };
  },
  async signOut() {
    return { error: null };
  },
};

export function createFakeSupabase() {
  return {
    auth: fakeAuth,
    from: makeTable,
    async rpc(_name: string, _args: unknown) {
      // RAG retrieval tolerates empty results — it falls back to intent.category.
      return { data: [], error: null };
    },
  };
}

export type FakeSupabase = ReturnType<typeof createFakeSupabase>;
