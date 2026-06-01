import "server-only";
import { env, isGroqConfigured } from "@/lib/env";
import {
  type AIProvider,
  type ChatMessage,
  type ChatOptions,
  ProviderError,
} from "@/lib/ai/types";

/**
 * Groq is OpenAI-compatible — Chat Completions API at /openai/v1/chat/completions.
 * No embeddings model; use Ollama for embed() when you pick Groq for chat.
 */
async function groqFetch(path: string, init: RequestInit): Promise<Response> {
  if (!isGroqConfigured()) {
    throw new ProviderError("Groq is not configured. Set GROQ_API_KEY.", "groq");
  }
  const base = (env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1").replace(/\/+$/, "");
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ProviderError(`Groq ${path} failed: ${res.status} ${text}`, "groq", res.status);
  }
  return res;
}

export const groqChat: AIProvider = {
  id: "groq",
  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
    const body = {
      model: opts.model ?? env.GROQ_CHAT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.2,
      stream: false,
      ...(opts.format === "json" ? { response_format: { type: "json_object" } } : {}),
    };
    const res = await groqFetch("/chat/completions", {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return data.choices?.[0]?.message?.content ?? "";
  },
  async *chatStream(messages: ChatMessage[], opts: ChatOptions = {}) {
    const body = {
      model: opts.model ?? env.GROQ_CHAT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.3,
      stream: true,
    };
    const res = await groqFetch("/chat/completions", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!res.body) throw new ProviderError("No response body", "groq");

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
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") {
          if (payload === "[DONE]") return;
          continue;
        }
        try {
          const obj = JSON.parse(payload) as {
            choices?: { delta?: { content?: string } }[];
          };
          const chunk = obj.choices?.[0]?.delta?.content;
          if (chunk) yield chunk;
        } catch {
          // skip malformed chunk
        }
      }
    }
  },
};
