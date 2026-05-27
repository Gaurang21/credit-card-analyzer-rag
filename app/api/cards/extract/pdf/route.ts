import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePdfBuffer } from "@/lib/cards/parse-pdf";
import { extractCardFromText } from "@/lib/cards/extract";

export const maxDuration = 60;
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  const supa = await createSupabaseServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "PDF too large (max 10MB)" }, { status: 413 });
  if (file.type && !file.type.includes("pdf"))
    return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 415 });

  try {
    const buf = await file.arrayBuffer();
    const text = await parsePdfBuffer(buf);
    if (text.length < 100) {
      return NextResponse.json({ error: "PDF appears to be empty or image-only." }, { status: 422 });
    }
    const card = await extractCardFromText(text);
    return NextResponse.json({ card });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 422 });
  }
}
