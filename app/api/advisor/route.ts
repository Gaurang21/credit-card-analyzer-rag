import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { retrieve } from "@/lib/rag/retrieve";
import { rankCards, streamAdvisor } from "@/lib/rag/advisor";
import { chatProviderId } from "@/lib/ai";

const BodySchema = z.object({ query: z.string().min(2).max(1000) });

export const maxDuration = 120;
export const runtime = "nodejs";

export async function POST(req: Request) {
  const supa = await createSupabaseServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });
  const query = parsed.data.query;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        const retrieval = await retrieve(user.id, query);
        const ranked = rankCards(retrieval);
        const amount = retrieval.intent.amount ?? 100;
        const rankedPayload = ranked.map((r) => ({
          cardName: r.card.name,
          issuer: r.card.issuer,
          appliedMultiplier: r.appliedMultiplier,
          matchedCategory: r.matchedCategory,
          amount,
          rewardPoints: r.rewardPoints,
          cashValue: r.cashValue,
          foreignFeePenalty: r.foreignFeePenalty,
          netValue: r.netValue,
          warnings: r.warnings,
        }));

        send({
          type: "meta",
          data: {
            intent: retrieval.intent,
            resolvedCategory: retrieval.resolvedCategory,
            merchantMatch: retrieval.merchantMatch,
            ranked: rankedPayload,
            provider: chatProviderId(),
          },
        });

        let fullText = "";
        try {
          for await (const chunk of streamAdvisor(query, retrieval, ranked)) {
            fullText += chunk;
            send({ type: "text", data: chunk });
          }
        } catch (e) {
          send({ type: "error", data: `Advisor LLM failed: ${(e as Error).message}` });
        }

        // Persist (best effort)
        try {
          await supa.from("advisor_queries").insert({
            user_id: user.id,
            query,
            response: JSON.parse(
              JSON.stringify({ ranked: rankedPayload, answer: fullText, intent: retrieval.intent }),
            ),
          });
        } catch {
          // ignore
        }

        send({ type: "done" });
      } catch (e) {
        send({ type: "error", data: (e as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
