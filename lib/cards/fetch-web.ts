import "server-only";
import * as cheerio from "cheerio";
import { htmlToCleanText } from "./text";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15";

/**
 * Fetch a card's product page and return readable text the LLM can extract from.
 * Many issuer pages are heavily JS-rendered or bot-blocked — we surface a clear
 * error so the UI can fall back to manual entry / PDF upload.
 */
export async function fetchCardPage(query: string): Promise<{ url: string; text: string }> {
  const trimmed = query.trim();
  if (!trimmed) throw new Error("Query is empty");

  // If the user pasted a URL, use it directly. Otherwise try a DuckDuckGo
  // HTML search and pick the first reasonable issuer result.
  const url = isUrl(trimmed) ? trimmed : await searchForCard(trimmed);
  const text = await fetchAndExtract(url);
  return { url, text };
}

function isUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

async function searchForCard(query: string): Promise<string> {
  const q = encodeURIComponent(`${query} credit card terms rewards`);
  const res = await fetch(`https://duckduckgo.com/html/?q=${q}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const link = $("a.result__a").first().attr("href");
  if (!link) throw new Error("No search results — paste the card's URL directly.");
  // DDG sometimes wraps in a redirect.
  const u = new URL(link, "https://duckduckgo.com");
  const real = u.searchParams.get("uddg") ?? link;
  return decodeURIComponent(real);
}

async function fetchAndExtract(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Fetch failed (${res.status}). The issuer may block bots — try manual or PDF.`);
  const html = await res.text();
  const clean = htmlToCleanText(html);
  if (clean.length < 200) {
    throw new Error("Page content too thin — likely JS-rendered. Try manual entry or PDF upload.");
  }
  return clean;
}
