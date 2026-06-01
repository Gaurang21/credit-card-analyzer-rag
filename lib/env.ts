import { z } from "zod";

const ServerEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal("")),

  // Chat backend selection: "ollama" (default) or "groq". Embeddings always use Ollama.
  AI_PROVIDER: z.enum(["ollama", "groq"]).default("ollama"),

  OLLAMA_BASE_URL: z.string().url().optional().or(z.literal("")),
  OLLAMA_API_TOKEN: z.string().optional().or(z.literal("")),
  OLLAMA_CHAT_MODEL: z.string().default("llama3.1:8b"),
  OLLAMA_EMBED_MODEL: z.string().default("nomic-embed-text"),

  GROQ_API_KEY: z.string().optional().or(z.literal("")),
  GROQ_BASE_URL: z.string().default("https://api.groq.com/openai/v1"),
  GROQ_CHAT_MODEL: z.string().default("llama-3.1-8b-instant"),

  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
});

export const env = ServerEnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  AI_PROVIDER: process.env.AI_PROVIDER ?? "ollama",
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL ?? "",
  OLLAMA_API_TOKEN: process.env.OLLAMA_API_TOKEN ?? "",
  OLLAMA_CHAT_MODEL: process.env.OLLAMA_CHAT_MODEL ?? "llama3.1:8b",
  OLLAMA_EMBED_MODEL: process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text",
  GROQ_API_KEY: process.env.GROQ_API_KEY ?? "",
  GROQ_BASE_URL: process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1",
  GROQ_CHAT_MODEL: process.env.GROQ_CHAT_MODEL ?? "llama-3.1-8b-instant",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

export const isSupabaseConfigured = () =>
  !!env.NEXT_PUBLIC_SUPABASE_URL && !!env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isOllamaConfigured = () => !!env.OLLAMA_BASE_URL && !!env.OLLAMA_API_TOKEN;

export const isGroqConfigured = () => !!env.GROQ_API_KEY;
