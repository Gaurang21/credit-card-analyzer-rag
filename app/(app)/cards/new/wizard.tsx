"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Globe, FileText, Upload } from "lucide-react";
import { CardForm } from "@/components/card-form";
import type { CardInput } from "@/lib/cards/schema";

type Tab = "manual" | "web" | "pdf";

const EMPTY: CardInput = {
  name: "",
  issuer: "",
  network: null,
  last_four: "",
  annual_fee: 0,
  foreign_txn_fee_pct: 0,
  signup_bonus: null,
  notes: "",
  categories: [],
};

export function AddCardWizard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("manual");
  const [prefill, setPrefill] = useState<CardInput>(EMPTY);
  const [confirmStep, setConfirmStep] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(data: CardInput) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `Save failed (${res.status})`);
      }
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (confirmStep) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent-soft">
          Review the parsed data below before saving. Edit anything that looks wrong.
        </div>
        <CardForm initial={prefill} onSubmit={handleSave} submitting={saving} submitLabel="Save card" />
        {error ? (
          <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div role="tablist" className="glass-card flex gap-1 p-1">
        <button role="tab" aria-selected={tab === "manual"} onClick={() => setTab("manual")} className="pill-tab inline-flex items-center justify-center gap-2">
          <Pencil className="h-4 w-4" aria-hidden /> Manual
        </button>
        <button role="tab" aria-selected={tab === "web"} onClick={() => setTab("web")} className="pill-tab inline-flex items-center justify-center gap-2">
          <Globe className="h-4 w-4" aria-hidden /> Fetch from web
        </button>
        <button role="tab" aria-selected={tab === "pdf"} onClick={() => setTab("pdf")} className="pill-tab inline-flex items-center justify-center gap-2">
          <FileText className="h-4 w-4" aria-hidden /> Upload PDF
        </button>
      </div>

      {tab === "manual" ? (
        <CardForm
          initial={EMPTY}
          onSubmit={handleSave}
          submitting={saving}
          submitLabel="Save card"
        />
      ) : null}

      {tab === "web" ? (
        <FetchFromWeb
          onParsed={(data) => {
            setPrefill(data);
            setConfirmStep(true);
          }}
        />
      ) : null}

      {tab === "pdf" ? (
        <UploadPdf
          onParsed={(data) => {
            setPrefill(data);
            setConfirmStep(true);
          }}
        />
      ) : null}

      {error ? (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
      ) : null}
    </div>
  );
}

function FetchFromWeb({ onParsed }: { onParsed: (c: CardInput) => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    if (!q.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/cards/extract/web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed to fetch");
      onParsed(j.card as CardInput);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card space-y-4 p-6">
      <p className="text-sm text-ink-300">
        Type a card name (e.g. <em>&ldquo;Chase Sapphire Preferred&rdquo;</em>) or paste a URL. We&apos;ll fetch the page, extract the data, and let you confirm before saving.
      </p>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder="Chase Sapphire Preferred"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          data-testid="web-query"
        />
        <button onClick={go} disabled={loading || !q.trim()} className="btn-primary whitespace-nowrap">
          {loading ? "Fetching…" : "Fetch"}
        </button>
      </div>
      {err ? (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{err}</div>
      ) : null}
      <p className="text-xs text-ink-400">Heads up: some issuer pages block scrapers. If this fails, try the PDF or manual tab.</p>
    </div>
  );
}

function UploadPdf({ onParsed }: { onParsed: (c: CardInput) => void }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  async function go() {
    if (!file) return;
    setLoading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/cards/extract/pdf", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Failed to parse");
      onParsed(j.card as CardInput);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card space-y-4 p-6">
      <p className="text-sm text-ink-300">Upload the card&apos;s terms PDF. We&apos;ll extract the rewards structure and let you confirm.</p>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 hover:border-accent/40">
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          data-testid="pdf-input"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Upload className="h-6 w-6 text-ink-300" aria-hidden />
        <span className="text-sm text-ink-200">{file ? file.name : "Click to choose a PDF"}</span>
        <span className="text-xs text-ink-400">Max ~10 MB</span>
      </label>
      <button onClick={go} disabled={loading || !file} className="btn-primary">
        {loading ? "Extracting…" : "Parse PDF"}
      </button>
      {err ? (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{err}</div>
      ) : null}
    </div>
  );
}
