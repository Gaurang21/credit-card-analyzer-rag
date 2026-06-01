/** Shared types for any LLM provider plugged into the AI router. */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  format?: "json";
}

export interface AIProvider {
  /** Provider id, for logging + bug reports. */
  readonly id: string;
  /** Single-shot chat completion → returns the full message content. */
  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<string>;
  /** Token-stream chat completion → yields content chunks as they arrive. */
  chatStream(messages: ChatMessage[], opts?: ChatOptions): AsyncGenerator<string, void, unknown>;
}

export interface EmbeddingProvider {
  readonly id: string;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
