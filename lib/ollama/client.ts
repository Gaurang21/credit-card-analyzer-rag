/**
 * @deprecated — kept as a thin compatibility shim. New code should import
 * from `@/lib/ai` directly, which routes between Ollama / Groq / the demo
 * fake based on `AI_PROVIDER` and `NEXT_PUBLIC_DEMO_MODE`.
 */
import "server-only";
export { chat, chatStream, embed, embedBatch, ProviderError as OllamaError } from "@/lib/ai";
export type { ChatMessage, ChatOptions } from "@/lib/ai";
