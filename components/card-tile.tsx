import Link from "next/link";
import { formatUSD } from "@/lib/utils";

interface Props {
  id: string;
  name: string;
  issuer: string | null;
  network: string | null;
  annualFee: number;
  foreignFee: number;
  topCategories: { category: string; multiplier: number }[];
}

const NETWORK_TINT: Record<string, string> = {
  Visa: "from-indigo-500/30 to-transparent",
  Mastercard: "from-orange-500/30 to-transparent",
  Amex: "from-emerald-500/30 to-transparent",
  Discover: "from-amber-500/30 to-transparent",
};

export function CardTile({ id, name, issuer, network, annualFee, foreignFee, topCategories }: Props) {
  const tint = network ? NETWORK_TINT[network] ?? "from-accent/30 to-transparent" : "from-accent/30 to-transparent";
  return (
    <Link href={`/cards/${id}`} className="group block">
      <article className="card-face h-56">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-tr ${tint}`} />
        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between">
            <div className="card-chip" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-ink-300">{network ?? ""}</span>
          </div>
          <div className="mt-auto">
            <p className="text-xs text-ink-300">{issuer ?? ""}</p>
            <p className="font-display text-xl text-white group-hover:text-accent-soft transition-colors">{name}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {topCategories.length === 0 ? (
                <span className="chip">No rewards set</span>
              ) : (
                topCategories.map((c) => (
                  <span key={c.category} className="chip">
                    {c.multiplier}× {c.category.replace(/_/g, " ")}
                  </span>
                ))
              )}
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-ink-400">
              <span>Annual {formatUSD(annualFee)}</span>
              <span>Foreign {foreignFee}%</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
