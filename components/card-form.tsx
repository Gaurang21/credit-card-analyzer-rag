"use client";

import { useState } from "react";
import { CardInputSchema, type CardInput, NetworkSchema } from "@/lib/cards/schema";

interface Props {
  initial: CardInput;
  onSubmit: (data: CardInput) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}

const NETWORKS = NetworkSchema.options;

export function CardForm({ initial, onSubmit, submitting, submitLabel = "Save" }: Props) {
  const [data, setData] = useState<CardInput>(initial);
  const [errors, setErrors] = useState<string[]>([]);

  function update<K extends keyof CardInput>(key: K, value: CardInput[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function addCategory() {
    update("categories", [...data.categories, { category: "", multiplier: 1, cap_amount: null, cap_period: null, notes: null }]);
  }
  function removeCategory(i: number) {
    update("categories", data.categories.filter((_, idx) => idx !== i));
  }
  function patchCategory(i: number, patch: Partial<CardInput["categories"][number]>) {
    update("categories", data.categories.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors([]);
    // Coerce empty strings to null on optional fields before validation.
    const cleaned: CardInput = {
      ...data,
      issuer: data.issuer || null,
      last_four: data.last_four || null,
      notes: data.notes || null,
    };
    const parsed = CardInputSchema.safeParse(cleaned);
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`));
      return;
    }
    await onSubmit(parsed.data);
  }

  return (
    <form className="glass-card space-y-6 p-6" onSubmit={submit} data-testid="card-form">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label" htmlFor="name">Card name</label>
          <input id="name" className="input" required value={data.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="issuer">Issuer</label>
          <input id="issuer" className="input" value={data.issuer ?? ""} onChange={(e) => update("issuer", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="network">Network</label>
          <select
            id="network"
            className="input"
            value={data.network ?? ""}
            onChange={(e) => update("network", (e.target.value || null) as CardInput["network"])}
          >
            <option value="">—</option>
            {NETWORKS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="last_four">Last 4</label>
          <input id="last_four" className="input" maxLength={4} value={data.last_four ?? ""} onChange={(e) => update("last_four", e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="annual_fee">Annual fee (USD)</label>
          <input id="annual_fee" type="number" min={0} step={1} className="input" value={data.annual_fee} onChange={(e) => update("annual_fee", Number(e.target.value))} />
        </div>
        <div>
          <label className="label" htmlFor="foreign_txn_fee_pct">Foreign txn fee (%)</label>
          <input id="foreign_txn_fee_pct" type="number" min={0} max={10} step={0.1} className="input" value={data.foreign_txn_fee_pct} onChange={(e) => update("foreign_txn_fee_pct", Number(e.target.value))} />
        </div>
        <div className="md:col-span-2">
          <label className="label" htmlFor="notes">Notes</label>
          <textarea id="notes" className="input min-h-[80px]" value={data.notes ?? ""} onChange={(e) => update("notes", e.target.value)} />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg">Rewards categories</h3>
          <button type="button" onClick={addCategory} className="btn-ghost text-xs">+ Add category</button>
        </div>
        {data.categories.length === 0 ? (
          <p className="text-xs text-ink-400">No categories yet. Add at least a &ldquo;flat&rdquo; row if the card has a baseline rate.</p>
        ) : (
          <div className="space-y-2">
            {data.categories.map((c, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <input
                  className="input col-span-5 md:col-span-4"
                  placeholder="dining"
                  value={c.category}
                  onChange={(e) => patchCategory(i, { category: e.target.value })}
                />
                <input
                  className="input col-span-3 md:col-span-2"
                  placeholder="3"
                  type="number"
                  step={0.1}
                  min={0}
                  value={c.multiplier}
                  onChange={(e) => patchCategory(i, { multiplier: Number(e.target.value) })}
                />
                <input
                  className="input col-span-3 md:col-span-3"
                  placeholder="cap $"
                  type="number"
                  value={c.cap_amount ?? ""}
                  onChange={(e) => patchCategory(i, { cap_amount: e.target.value ? Number(e.target.value) : null })}
                />
                <input
                  className="input col-span-3 md:col-span-2"
                  placeholder="per (yr/qtr)"
                  value={c.cap_period ?? ""}
                  onChange={(e) => patchCategory(i, { cap_period: e.target.value || null })}
                />
                <button type="button" onClick={() => removeCategory(i)} className="col-span-1 text-ink-400 hover:text-red-300" aria-label="Remove category">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {errors.length > 0 ? (
        <ul className="space-y-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {errors.map((e, i) => <li key={i}>• {e}</li>)}
        </ul>
      ) : null}

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
