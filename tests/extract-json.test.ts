import { describe, it, expect } from "vitest";
import { extractJson, JsonExtractError } from "@/lib/ollama/extract-json";

describe("extractJson", () => {
  it("parses bare JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips ```json fences", () => {
    const raw = "Sure! Here is the answer:\n```json\n{\"a\":2}\n```\n";
    expect(extractJson(raw)).toEqual({ a: 2 });
  });

  it("recovers from leading prose", () => {
    expect(extractJson('Here you go: {"x": "hi"} done.')).toEqual({ x: "hi" });
  });

  it("handles nested objects with strings containing braces", () => {
    const obj = { msg: "use { wisely }", nested: { a: [1, 2, 3] } };
    expect(extractJson(JSON.stringify(obj))).toEqual(obj);
  });

  it("throws on garbage", () => {
    expect(() => extractJson("no json here")).toThrow(JsonExtractError);
  });
});
