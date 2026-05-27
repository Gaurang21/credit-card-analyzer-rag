import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchCardPage } from "@/lib/cards/fetch-web";
import { extractCardFromText } from "@/lib/cards/extract";

const BodySchema = z.object({ query: z.string().min(2).max(500) });

export const maxDuration = 60;

export async function POST(req: Request) {
  const supa = await createSupabaseServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  try {
    const { url, text } = await fetchCardPage(parsed.data.query);
    const card = await extractCardFromText(text, parsed.data.query);
    return NextResponse.json({ url, card });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
}
