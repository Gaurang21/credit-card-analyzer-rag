import { describe, it, expect, vi, beforeEach } from "vitest";

describe("groq provider", () => {
  beforeEach(() => {
    process.env.GROQ_API_KEY = "test-key";
    process.env.AI_PROVIDER = "groq";
    vi.resetModules();
  });

  it("posts to /chat/completions with bearer auth and parses the response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: { content: "hello world" } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { groqChat } = await import("@/lib/ai/providers/groq");
    const out = await groqChat.chat([
      { role: "system", content: "be concise" },
      { role: "user", content: "say hi" },
    ]);
    expect(out).toBe("hello world");

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toContain("/chat/completions");
    const headers = (init!.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-key");
    const body = JSON.parse(init!.body as string);
    expect(body.stream).toBe(false);
    expect(body.messages).toHaveLength(2);
  });

  it("parses an OpenAI-style SSE stream into content chunks", async () => {
    const lines = [
      `data: ${JSON.stringify({ choices: [{ delta: { content: "Hello" } }] })}`,
      `data: ${JSON.stringify({ choices: [{ delta: { content: " world" } }] })}`,
      `data: [DONE]`,
      ``,
    ].join("\n\n");

    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        // Push in 8-char chunks to exercise the line buffer.
        const chunks = lines.match(/.{1,8}/gs) ?? [lines];
        for (const c of chunks) controller.enqueue(encoder.encode(c));
        controller.close();
      },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(stream, { status: 200, headers: { "Content-Type": "text/event-stream" } }),
    );

    const { groqChat } = await import("@/lib/ai/providers/groq");
    const out: string[] = [];
    for await (const chunk of groqChat.chatStream([{ role: "user", content: "go" }])) {
      out.push(chunk);
    }
    expect(out.join("")).toBe("Hello world");
  });

  it("throws ProviderError when GROQ_API_KEY is missing", async () => {
    process.env.GROQ_API_KEY = "";
    const { groqChat } = await import("@/lib/ai/providers/groq");
    await expect(groqChat.chat([{ role: "user", content: "x" }])).rejects.toMatchObject({
      provider: "groq",
    });
  });
});

describe("ai router", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "";
    vi.resetModules();
  });

  it("returns 'groq' as the active chat provider when AI_PROVIDER=groq", async () => {
    process.env.AI_PROVIDER = "groq";
    const { chatProviderId } = await import("@/lib/ai");
    expect(chatProviderId()).toBe("groq");
  });

  it("returns 'ollama' as the default", async () => {
    process.env.AI_PROVIDER = "ollama";
    const { chatProviderId } = await import("@/lib/ai");
    expect(chatProviderId()).toBe("ollama");
  });

  it("returns 'demo' when DEMO_MODE is on, regardless of AI_PROVIDER", async () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = "1";
    process.env.AI_PROVIDER = "groq";
    const { chatProviderId } = await import("@/lib/ai");
    expect(chatProviderId()).toBe("demo");
  });
});
