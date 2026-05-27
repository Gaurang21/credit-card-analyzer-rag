import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CardTile } from "@/components/card-tile";
import { formatUSD } from "@/lib/utils";

export const metadata = { title: "Wallet · Vault" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supa = await createSupabaseServerClient();
  const { data: cards } = await supa
    .from("cards")
    .select("id,name,issuer,network,annual_fee,foreign_txn_fee_pct,card_categories(category,multiplier)")
    .order("created_at", { ascending: false });

  const list = cards ?? [];
  const annualSpend = list.reduce((acc, c) => acc + (Number(c.annual_fee) || 0), 0);

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="chip">Wallet</p>
          <h1 className="mt-2 font-display text-4xl">Your cards</h1>
          <p className="mt-1 text-sm text-ink-300">
            {list.length} card{list.length === 1 ? "" : "s"} · {formatUSD(annualSpend)} in annual fees
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/advisor" className="btn-ghost">Ask the advisor</Link>
          <Link href="/cards/new" className="btn-primary">+ Add card</Link>
        </div>
      </header>

      {list.length === 0 ? (
        <EmptyWallet />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <CardTile
              key={c.id}
              id={c.id}
              name={c.name}
              issuer={c.issuer}
              network={c.network}
              annualFee={Number(c.annual_fee) || 0}
              foreignFee={Number(c.foreign_txn_fee_pct) || 0}
              topCategories={(c.card_categories ?? [])
                .slice()
                .sort((a, b) => Number(b.multiplier) - Number(a.multiplier))
                .slice(0, 3)
                .map((x) => ({ category: x.category, multiplier: Number(x.multiplier) }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyWallet() {
  return (
    <div className="glass-card p-10 text-center">
      <h2 className="font-display text-2xl">Your wallet is empty</h2>
      <p className="mt-2 text-sm text-ink-300">Add your first card to start getting recommendations.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/cards/new" className="btn-primary">Add a card</Link>
      </div>
    </div>
  );
}
