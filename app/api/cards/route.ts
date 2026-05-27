import { NextResponse } from "next/server";
import { CardInputSchema } from "@/lib/cards/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { embedAndStoreCard } from "@/lib/rag/embed-card";

export async function POST(req: Request) {
  const supa = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = CardInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const card = parsed.data;

  const { data: inserted, error: insertErr } = await supa
    .from("cards")
    .insert({
      user_id: user.id,
      name: card.name,
      issuer: card.issuer ?? null,
      network: card.network ?? null,
      last_four: card.last_four || null,
      annual_fee: card.annual_fee,
      foreign_txn_fee_pct: card.foreign_txn_fee_pct,
      signup_bonus: card.signup_bonus ?? null,
      notes: card.notes ?? null,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json({ error: insertErr?.message ?? "Insert failed" }, { status: 500 });
  }

  if (card.categories.length > 0) {
    const rows = card.categories.map((c) => ({
      card_id: inserted.id,
      category: c.category,
      multiplier: c.multiplier,
      cap_amount: c.cap_amount ?? null,
      cap_period: c.cap_period ?? null,
      notes: c.notes ?? null,
    }));
    const { error: catErr } = await supa.from("card_categories").insert(rows);
    if (catErr) {
      return NextResponse.json({ error: `Card saved but categories failed: ${catErr.message}` }, { status: 500 });
    }
  }

  // Best-effort embedding — don't block the user if Ollama is down.
  try {
    await embedAndStoreCard(inserted.id, card);
  } catch {
    // Surfaced silently — card still saves.
  }

  return NextResponse.json({ id: inserted.id }, { status: 201 });
}
