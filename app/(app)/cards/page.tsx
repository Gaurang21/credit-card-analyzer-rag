import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatUSD } from "@/lib/utils";

export const metadata = { title: "Cards · Vault" };
export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const supa = await createSupabaseServerClient();
  const { data } = await supa
    .from("cards")
    .select("id,name,issuer,network,annual_fee,foreign_txn_fee_pct,created_at")
    .order("created_at", { ascending: false });
  const cards = data ?? [];

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <p className="chip">Cards</p>
          <h1 className="mt-2 font-display text-4xl">All cards</h1>
        </div>
        <Link href="/cards/new" className="btn-primary">+ Add card</Link>
      </header>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-widest text-ink-300">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Issuer</th>
              <th className="px-5 py-3">Network</th>
              <th className="px-5 py-3">Annual</th>
              <th className="px-5 py-3">Foreign</th>
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink-300">
                  No cards yet. <Link href="/cards/new" className="text-accent">Add one →</Link>
                </td>
              </tr>
            ) : (
              cards.map((c) => (
                <tr key={c.id} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <Link href={`/cards/${c.id}`} className="text-white hover:text-accent">{c.name}</Link>
                  </td>
                  <td className="px-5 py-3 text-ink-300">{c.issuer ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-300">{c.network ?? "—"}</td>
                  <td className="px-5 py-3 text-ink-300">{formatUSD(Number(c.annual_fee) || 0)}</td>
                  <td className="px-5 py-3 text-ink-300">{Number(c.foreign_txn_fee_pct) || 0}%</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
