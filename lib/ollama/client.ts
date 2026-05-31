import "server-only";
import { env, isOllamaConfigured } from "@/lib/env";
import { DEMO_MODE } from "@/lib/demo/flag";
import {
  fakeAdvisorStream,
  fakeCardExtraction,
  fakeEmbedding,
  fakeQueryIntent,
} from "@/lib/demo/ollama-fake";

export class OllamaError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "OllamaError";
  }
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (env.OLLAMA_API_TOKEN) {
    headers.Authorization = `Bearer ${env.OLLAMA_API_TOKEN}`;
  }
  return headers;
}

async function ollamaFetch(path: string, init: RequestInit): Promise<Response> {
  if (!isOllamaConfigured()) {
    throw new OllamaError("Ollama is not configured. Set OLLAMA_BASE_URL and OLLAMA_API_TOKEN.");
  }
  const base = (env.OLLAMA_BASE_URL ?? "").replace(/\/+$/, "");
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OllamaError(`Ollama ${path} failed: ${res.status} ${text}`, res.status);
  }
  return res;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  format?: "json";
}

/** Non-streaming chat — returns the full message content. */
export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  if (DEMO_MODE) {
    const sys = messages.find((m) => m.role === "system")?.content ?? "";
    if (sys.includes("structured intent")) return fakeQueryIntent(messages[messages.length - 1]?.content ?? "");
    if (sys.includes("credit-card data extractor")) return fakeCardExtraction();
    return "Demo response.";
  }
  const body = {
    model: opts.model ?? env.OLLAMA_CHAT_MODEL,
    messages,
    stream: false,
    options: { temperature: opts.temperature ?? 0.2 },
    ...(opts.format ? { format: opts.format } : {}),
  };
  const res = await ollamaFetch("/api/chat", { method: "POST", body: JSON.stringify(body) });
  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content ?? "";
}

/** Streaming chat — yields content chunks as they arrive. */
export async function* chatStream(
  messages: ChatMessage[],
  opts: ChatOptions = {},
): AsyncGenerator<string, void, unknown> {
  if (DEMO_MODE) {
    for await (const chunk of fakeAdvisorStream(messages)) yield chunk;
    return;
  }
  const body = {
    model: opts.model ?? env.OLLAMA_CHAT_MODEL,
    messages,
    stream: true,
    options: { temperature: opts.temperature ?? 0.3 },
  };
  const res = await ollamaFetch("/api/chat", { method: "POST", body: JSON.stringify(body) });
  if (!res.body) throw new OllamaError("No response body from Ollama");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const obj = JSON.parse(trimmed) as { message?: { content?: string }; done?: boolean };
        if (obj.message?.content) yield obj.message.content;
        if (obj.done) return;
      } catch {
        // skip malformed line
      }
    }
  }
}

/** Single embedding. */
export async function embed(text: string): Promise<number[]> {
  if (DEMO_MODE) return fakeEmbedding(text);
  const body = { model: env.OLLAMA_EMBED_MODEL, input: text };
  const res = await ollamaFetch("/api/embed", { method: "POST", body: JSON.stringify(body) });
  const data = (await res.json()) as { embeddings?: number[][] };
  const vec = data.embeddings?.[0];
  if (!vec) throw new OllamaError("Ollama returned no embedding");
  return vec;
}

/** Batched embeddings. */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (DEMO_MODE) return texts.map((t) => fakeEmbedding(t));
  const body = { model: env.OLLAMA_EMBED_MODEL, input: texts };
  const res = await ollamaFetch("/api/embed", { method: "POST", body: JSON.stringify(body) });
  const data = (await res.json()) as { embeddings?: number[][] };
  if (!data.embeddings) throw new OllamaError("Ollama returned no embeddings");
  return data.embeddings;
}
