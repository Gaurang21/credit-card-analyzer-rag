/**
 * Provider-agnostic AI router. Pick a chat backend at request time via the
 * `AI_PROVIDER` env var (default: `ollama`). Embeddings always go through
 * Ollama (Groq doesn't expose an embeddings endpoint).
 *
 * Components never import providers directly — go through this module.
 */
import "server-only";
import { env } from "@/lib/env";
import { DEMO_MODE } from "@/lib/demo/flag";
import {
  type AIProvider,
  type ChatMessage,
  type ChatOptions,
  type EmbeddingProvider,
} from "./types";
import { ollamaChat, ollamaEmbed } from "./providers/ollama";
import { groqChat } from "./providers/groq";
import {
  fakeAdvisorStream,
  fakeCardExtraction,
  fakeEmbedding,
  fakeQueryIntent,
} from "@/lib/demo/ollama-fake";

const DEMO_CHAT: AIProvider = {
  id: "demo",
  async chat(messages) {
    const sys = messages.find((m) => m.role === "system")?.content ?? "";
    if (sys.includes("structured intent")) {
      return fakeQueryIntent(messages[messages.length - 1]?.content ?? "");
    }
    if (sys.includes("credit-card data extractor")) return fakeCardExtraction();
    return "Demo response.";
  },
  async *chatStream(messages) {
    for await (const chunk of fakeAdvisorStream(messages)) yield chunk;
  },
};

const DEMO_EMBED: EmbeddingProvider = {
  id: "demo",
  async embed(text: string) {
    return fakeEmbedding(text);
  },
  async embedBatch(texts: string[]) {
    return texts.map((t) => fakeEmbedding(t));
  },
};

function pickChatProvider(): AIProvider {
  if (DEMO_MODE) return DEMO_CHAT;
  const choice = env.AI_PROVIDER;
  if (choice === "groq") return groqChat;
  return ollamaChat;
}

function pickEmbedProvider(): EmbeddingProvider {
  if (DEMO_MODE) return DEMO_EMBED;
  // Groq does not embed — always Ollama for vectors.
  return ollamaEmbed;
}

/** Active chat provider id for the current request. Useful in logs/UI. */
export function chatProviderId(): string {
  return pickChatProvider().id;
}

export function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  return pickChatProvider().chat(messages, opts);
}

export function chatStream(messages: ChatMessage[], opts: ChatOptions = {}) {
  return pickChatProvider().chatStream(messages, opts);
}

export function embed(text: string): Promise<number[]> {
  return pickEmbedProvider().embed(text);
}

export function embedBatch(texts: string[]): Promise<number[][]> {
  return pickEmbedProvider().embedBatch(texts);
}

export { ProviderError } from "./types";
export type { ChatMessage, ChatOptions, AIProvider, EmbeddingProvider };
