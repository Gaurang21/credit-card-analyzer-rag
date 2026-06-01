"use client";

import { useState } from "react";
import { formatPoints, formatUSD } from "@/lib/utils";

interface RankPayload {
  cardName: string;
  issuer: string | null;
  appliedMultiplier: number;
  matchedCategory: string | null;
  amount: number;
  rewardPoints: number;
  cashValue: number;
  foreignFeePenalty: number;
  netValue: number;
  warnings: string[];
}

interface MetaPayload {
  intent: {
    merchant: string | null;
    category: string | null;
    amount: number | null;
    is_international: boolean;
  };
  resolvedCategory: string | null;
  merchantMatch: { merchant: string; category: string; similarity: number } | null;
  ranked: RankPayload[];
  provider?: string;
}

export function AdvisorChat({ samples }: { samples: string[] }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [meta, setMeta] = useState<MetaPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask(text: string) {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setMeta(null);
    setStreamText("");
    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Advisor failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try {
            const evt = JSON.parse(payload) as
              | { type: "meta"; data: MetaPayload }
              | { type: "text"; data: string }
              | { type: "done" }
              | { type: "error"; data: string };
            if (evt.type === "meta") setMeta(evt.data);
            else if (evt.type === "text") setStreamText((s) => s + evt.data);
            else if (evt.type === "error") setError(evt.data);
          } catch {
            // ignore malformed event
          }
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
        className="glass-card flex flex-col gap-3 p-4 md:flex-row md:items-center"
        data-testid="advisor-form"
      >
        <input
          className="input flex-1"
          placeholder="$3,000 MacBook — which card?"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-testid="advisor-input"
        />
        <button type="submit" disabled={loading || !q.trim()} className="btn-primary md:w-auto" data-testid="advisor-submit">
          {loading ? "Thinking…" : "Ask"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {samples.map((s) => (
          <button key={s} onClick={() => { setQ(s); void ask(s); }} className="chip hover:border-accent/40 hover:text-white">
            {s}
          </button>
        ))}
      </div>

      {error ? (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
      ) : null}

      {meta ? <IntentRow meta={meta} /> : null}

      {meta?.ranked && meta.ranked.length > 0 ? (
        <section className="space-y-3" data-testid="advisor-ranked">
          <h2 className="font-display text-2xl">Recommended</h2>
          {meta.ranked.slice(0, 3).map((r, i) => (
            <Receipt key={i} rank={i + 1} r={r} />
          ))}
        </section>
      ) : null}

      {streamText || loading ? (
        <section className="glass-card p-6">
          <h2 className="font-display text-2xl">Advisor</h2>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-100" data-testid="advisor-stream">
            {streamText || <span className="shimmer inline-block h-4 w-2/3 rounded" />}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function IntentRow({ meta }: { meta: MetaPayload }) {
  const chips: string[] = [];
  if (meta.intent.merchant) chips.push(`merchant: ${meta.intent.merchant}`);
  if (meta.resolvedCategory) chips.push(`category: ${meta.resolvedCategory}`);
  if (meta.intent.amount != null) chips.push(`amount: ${formatUSD(meta.intent.amount)}`);
  if (meta.intent.is_international) chips.push("international");
  if (meta.merchantMatch) chips.push(`match: ${meta.merchantMatch.merchant} (${(meta.merchantMatch.similarity * 100).toFixed(0)}%)`);
  if (meta.provider) chips.push(`via ${meta.provider}`);
  return (
    <div className="flex flex-wrap gap-2" data-testid="advisor-intent">
      {chips.map((c) => <span key={c} className="chip">{c}</span>)}
    </div>
  );
}

function Receipt({ rank, r }: { rank: number; r: RankPayload }) {
  const isWinner = rank === 1;
  return (
    <article className={`receipt ${isWinner ? "border-accent/40 shadow-glow" : ""}`}>
      <div className="flex items-start justify-between font-sans">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-ink-400">#{rank}{isWinner ? " · top pick" : ""}</div>
          <div className="font-display text-lg text-white">{r.cardName}</div>
          {r.issuer ? <div className="text-xs text-ink-400">{r.issuer}</div> : null}
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-ink-400">net value</div>
          <div className={`font-display text-2xl ${isWinner ? "gold-text" : "text-white"}`}>
            {formatUSD(r.netValue)}
          </div>
        </div>
      </div>
      <hr className="my-3 border-white/5" />
      <ul className="space-y-1.5">
        <li>
          {r.appliedMultiplier}× {r.matchedCategory ?? "flat"} on {formatUSD(r.amount)} ={" "}
          <span className="text-white">{formatPoints(r.rewardPoints)} pts</span>{" "}
          <span className="text-ink-400">≈ {formatUSD(r.cashValue)}</span>
        </li>
        {r.foreignFeePenalty > 0 ? (
          <li className="text-red-300">− Foreign txn fee: {formatUSD(r.foreignFeePenalty)}</li>
        ) : null}
        {r.warnings.map((w, i) => (
          <li key={i} className="text-ink-400">⚠ {w}</li>
        ))}
      </ul>
    </article>
  );
}
