import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = { title: "History · Vault" };
export const dynamic = "force-dynamic";

interface StoredResponse {
  ranked?: { cardName: string; netValue: number }[];
  answer?: string;
}

export default async function HistoryPage() {
  const supa = await createSupabaseServerClient();
  const { data } = await supa
    .from("advisor_queries")
    .select("id,query,response,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <p className="chip">History</p>
        <h1 className="mt-2 font-display text-4xl">Past questions</h1>
      </header>

      {rows.length === 0 ? (
        <div className="glass-card p-10 text-center text-ink-300">No queries yet.</div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const resp = (r.response ?? {}) as StoredResponse;
            const top = resp.ranked?.[0];
            return (
              <li key={r.id} className="glass-card p-5">
                <div className="text-xs text-ink-400">{new Date(r.created_at).toLocaleString()}</div>
                <p className="mt-1 font-display text-lg text-white">&ldquo;{r.query}&rdquo;</p>
                {top ? (
                  <p className="mt-2 text-sm text-ink-200">
                    Top pick: <span className="text-accent">{top.cardName}</span> · net ${top.netValue.toFixed(2)}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
