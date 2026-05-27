import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatUSD } from "@/lib/utils";
import { DeleteCardButton } from "./delete-button";

export const dynamic = "force-dynamic";

export default async function CardDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supa = await createSupabaseServerClient();
  const { data: card } = await supa
    .from("cards")
    .select("id,name,issuer,network,last_four,annual_fee,foreign_txn_fee_pct,notes,signup_bonus,card_categories(category,multiplier,cap_amount,cap_period,notes)")
    .eq("id", id)
    .maybeSingle();
  if (!card) notFound();

  const cats = (card.card_categories ?? []).slice().sort((a, b) => Number(b.multiplier) - Number(a.multiplier));

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4">
        <div>
          <Link href="/cards" className="text-xs text-ink-400 hover:text-white">← All cards</Link>
          <h1 className="mt-2 font-display text-4xl">{card.name}</h1>
          <p className="mt-1 text-sm text-ink-300">{card.issuer ?? ""} {card.network ? `· ${card.network}` : ""}</p>
        </div>
        <DeleteCardButton id={card.id} />
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        <Stat label="Annual fee" value={formatUSD(Number(card.annual_fee) || 0)} />
        <Stat label="Foreign txn fee" value={`${Number(card.foreign_txn_fee_pct) || 0}%`} />
        <Stat label="Last 4" value={card.last_four ?? "—"} />
      </section>

      <section className="glass-card p-6">
        <h2 className="font-display text-xl">Rewards</h2>
        {cats.length === 0 ? (
          <p className="mt-2 text-sm text-ink-300">No categories on file.</p>
        ) : (
          <ul className="mt-4 grid gap-2 md:grid-cols-2">
            {cats.map((c, i) => (
              <li key={i} className="rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white capitalize">{c.category.replace(/_/g, " ")}</span>
                  <span className="font-mono text-accent">{c.multiplier}×</span>
                </div>
                {c.cap_amount ? (
                  <p className="mt-1 text-xs text-ink-400">cap {formatUSD(Number(c.cap_amount))}{c.cap_period ? ` / ${c.cap_period}` : ""}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {card.notes ? (
        <section className="glass-card p-6">
          <h2 className="font-display text-xl">Notes</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-ink-200">{card.notes}</p>
        </section>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card p-5">
      <div className="text-xs uppercase tracking-widest text-ink-400">{label}</div>
      <div className="mt-1 font-display text-2xl">{value}</div>
    </div>
  );
}
