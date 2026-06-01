import "server-only";
import { env, isOllamaConfigured } from "@/lib/env";
import {
  type AIProvider,
  type ChatMessage,
  type ChatOptions,
  type EmbeddingProvider,
  ProviderError,
} from "@/lib/ai/types";

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (env.OLLAMA_API_TOKEN) headers.Authorization = `Bearer ${env.OLLAMA_API_TOKEN}`;
  return headers;
}

async function ollamaFetch(path: string, init: RequestInit): Promise<Response> {
  if (!isOllamaConfigured()) {
    throw new ProviderError(
      "Ollama is not configured. Set OLLAMA_BASE_URL and OLLAMA_API_TOKEN.",
      "ollama",
    );
  }
  const base = (env.OLLAMA_BASE_URL ?? "").replace(/\/+$/, "");
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ProviderError(`Ollama ${path} failed: ${res.status} ${text}`, "ollama", res.status);
  }
  return res;
}

export const ollamaChat: AIProvider = {
  id: "ollama",
  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
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
  },
  async *chatStream(messages: ChatMessage[], opts: ChatOptions = {}) {
    const body = {
      model: opts.model ?? env.OLLAMA_CHAT_MODEL,
      messages,
      stream: true,
      options: { temperature: opts.temperature ?? 0.3 },
    };
    const res = await ollamaFetch("/api/chat", { method: "POST", body: JSON.stringify(body) });
    if (!res.body) throw new ProviderError("No response body", "ollama");

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
  },
};

export const ollamaEmbed: EmbeddingProvider = {
  id: "ollama",
  async embed(text: string): Promise<number[]> {
    const body = { model: env.OLLAMA_EMBED_MODEL, input: text };
    const res = await ollamaFetch("/api/embed", { method: "POST", body: JSON.stringify(body) });
    const data = (await res.json()) as { embeddings?: number[][] };
    const vec = data.embeddings?.[0];
    if (!vec) throw new ProviderError("No embedding returned", "ollama");
    return vec;
  },
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const body = { model: env.OLLAMA_EMBED_MODEL, input: texts };
    const res = await ollamaFetch("/api/embed", { method: "POST", body: JSON.stringify(body) });
    const data = (await res.json()) as { embeddings?: number[][] };
    if (!data.embeddings) throw new ProviderError("No embeddings returned", "ollama");
    return data.embeddings;
  },
};
