/**
 * LLMs occasionally wrap JSON in ```json fences or add a prefix sentence.
 * Strip the noise and parse, throwing a typed error on failure.
 */
export class JsonExtractError extends Error {
  constructor(
    message: string,
    public raw: string,
  ) {
    super(message);
    this.name = "JsonExtractError";
  }
}

export function extractJson<T = unknown>(raw: string): T {
  if (!raw || typeof raw !== "string") {
    throw new JsonExtractError("Empty LLM response", raw ?? "");
  }
  const trimmed = raw.trim();

  // Try direct parse first.
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // fall through
  }

  // Strip ``` fences.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    try {
      return JSON.parse(fenced[1]) as T;
    } catch {
      // fall through
    }
  }

  // Best effort: take the first balanced { ... } or [ ... ] block.
  const start = trimmed.search(/[{[]/);
  if (start === -1) throw new JsonExtractError("No JSON object found", raw);
  const opener = trimmed[start]!;
  const closer = opener === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < trimmed.length; i++) {
    const ch = trimmed[i]!;
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === opener) depth++;
    else if (ch === closer) {
      depth--;
      if (depth === 0) {
        const slice = trimmed.slice(start, i + 1);
        try {
          return JSON.parse(slice) as T;
        } catch (err) {
          throw new JsonExtractError(`Failed to parse balanced JSON: ${(err as Error).message}`, raw);
        }
      }
    }
  }
  throw new JsonExtractError("Unbalanced JSON in LLM response", raw);
}
