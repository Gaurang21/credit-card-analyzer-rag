import { describe, it, expect } from "vitest";
import { createFakeSupabase } from "@/lib/demo/supabase-fake";

describe("demo supabase fake", () => {
  it("returns seeded cards with joined categories", async () => {
    const supa = createFakeSupabase();
    const { data, error } = await supa
      .from("cards")
      .select("id,name,issuer,card_categories(category,multiplier)");
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThanOrEqual(4);
    const sapphire = (data ?? []).find((c) => (c as { name: string }).name === "Sapphire Preferred");
    expect(sapphire).toBeDefined();
    const cats = (sapphire as { card_categories?: { category: string }[] }).card_categories ?? [];
    expect(cats.map((c) => c.category)).toContain("travel");
  });

  it("inserts a new card and surfaces it on subsequent select", async () => {
    const supa = createFakeSupabase();
    const { data: inserted } = await supa
      .from("cards")
      .insert({
        name: "Test Card",
        issuer: "TestBank",
        network: "Visa",
        annual_fee: 0,
        foreign_txn_fee_pct: 0,
      })
      .select("id")
      .single();
    expect(inserted).toBeDefined();
    const { data: rows } = await supa.from("cards").select("name");
    const names = (rows ?? []).map((r) => (r as { name: string }).name);
    expect(names).toContain("Test Card");
  });

  it("deletes a card by id", async () => {
    const supa = createFakeSupabase();
    const { data: before } = await supa.from("cards").select("id,name");
    const target = before?.[0] as { id: string; name: string } | undefined;
    expect(target).toBeDefined();
    await supa.from("cards").delete().eq("id", target!.id);
    const { data: after } = await supa.from("cards").select("id");
    expect((after ?? []).find((r) => (r as { id: string }).id === target!.id)).toBeUndefined();
  });

  it("auto-authenticates the demo user", async () => {
    const supa = createFakeSupabase();
    const { data } = await supa.auth.getUser();
    expect(data.user?.email).toBe("demo@vault.app");
  });
});
