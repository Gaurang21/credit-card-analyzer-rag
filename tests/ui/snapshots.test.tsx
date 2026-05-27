/**
 * Renders the key UI states to standalone HTML files in `e2e/screenshots/`.
 * Not pixel screenshots — but lets a human eyeball the markup and styles in
 * any browser without spinning up the dev server or hooking up real auth.
 */
import { describe, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

import MarketingHome from "@/app/page";
import { CardTile } from "@/components/card-tile";

const OUT = path.resolve(__dirname, "../../e2e/screenshots");
mkdirSync(OUT, { recursive: true });

const TAILWIND_CDN = `<script src="https://cdn.tailwindcss.com"></script>`;
const STYLES = readFileSync(path.resolve(__dirname, "../../app/globals.css"), "utf8");

function wrap(title: string, body: string) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
${TAILWIND_CDN}
<style>${STYLES.replace(/@tailwind[^;]+;/g, "")}</style>
</head>
<body class="bg-ink-950 text-ink-100 min-h-screen" style="background-image: radial-gradient(circle at 18% -10%, rgba(200,165,96,0.16), transparent 45%), radial-gradient(circle at 80% 110%, rgba(52,211,153,0.12), transparent 50%), linear-gradient(180deg,#05070d 0%, #0b0e18 100%); background-attachment: fixed;">
${body}
</body>
</html>`;
}

describe("HTML snapshot dumps (for human review)", () => {
  it("dumps the marketing home page", () => {
    const html = renderToStaticMarkup(<MarketingHome />);
    writeFileSync(path.join(OUT, "marketing-home.html"), wrap("Vault — Home", html));
  });

  it("dumps a wallet of card tiles", () => {
    const html = renderToStaticMarkup(
      <div className="mx-auto max-w-5xl px-5 py-10">
        <header className="mb-8">
          <p className="chip">Wallet</p>
          <h1 className="mt-2 font-display text-4xl">Your cards</h1>
          <p className="mt-1 text-sm text-ink-300">3 cards · $190.00 in annual fees</p>
        </header>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <CardTile id="1" name="Sapphire Preferred" issuer="Chase" network="Visa" annualFee={95} foreignFee={0}
            topCategories={[{ category: "travel", multiplier: 3 }, { category: "dining", multiplier: 2 }, { category: "flat", multiplier: 1 }]} />
          <CardTile id="2" name="Amex Gold" issuer="American Express" network="Amex" annualFee={250} foreignFee={0}
            topCategories={[{ category: "dining", multiplier: 4 }, { category: "groceries", multiplier: 4 }]} />
          <CardTile id="3" name="Freedom Unlimited" issuer="Chase" network="Visa" annualFee={0} foreignFee={3}
            topCategories={[{ category: "flat", multiplier: 1.5 }]} />
        </div>
      </div>,
    );
    writeFileSync(path.join(OUT, "dashboard-wallet.html"), wrap("Vault — Wallet", html));
  });

  it("dumps a sample advisor receipt", () => {
    const receiptHtml = `
      <div class="mx-auto max-w-3xl px-5 py-10">
        <header class="mb-6">
          <p class="chip">Advisor</p>
          <h1 class="mt-2 font-display text-4xl">Which card should I use?</h1>
        </header>
        <form class="glass-card flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <input class="input flex-1" value="I'm buying a $3,000 MacBook — which card?" readonly>
          <button class="btn-primary">Ask</button>
        </form>
        <div class="flex flex-wrap gap-2 my-6">
          <span class="chip">merchant: Apple Store</span>
          <span class="chip">category: electronics</span>
          <span class="chip">amount: $3,000.00</span>
          <span class="chip">match: Apple Store (93%)</span>
        </div>
        <h2 class="font-display text-2xl mb-3">Recommended</h2>
        <article class="receipt border-accent/40 shadow-glow mb-3">
          <div class="flex items-start justify-between font-sans">
            <div>
              <div class="text-[10px] uppercase tracking-widest text-ink-400">#1 · top pick</div>
              <div class="font-display text-lg text-white">Citi Custom Cash</div>
              <div class="text-xs text-ink-400">Citi</div>
            </div>
            <div class="text-right">
              <div class="text-[10px] uppercase tracking-widest text-ink-400">net value</div>
              <div class="font-display text-2xl gold-text">$150.00</div>
            </div>
          </div>
          <hr class="my-3 border-white/5" />
          <ul class="space-y-1.5">
            <li>5× electronics on $3,000.00 = <span class="text-white">15,000 pts</span> <span class="text-ink-400">≈ $150.00</span></li>
            <li class="text-ink-400">⚠ Category cap: $500/month</li>
          </ul>
        </article>
        <article class="receipt mb-3">
          <div class="flex items-start justify-between font-sans">
            <div>
              <div class="text-[10px] uppercase tracking-widest text-ink-400">#2</div>
              <div class="font-display text-lg text-white">Freedom Unlimited</div>
              <div class="text-xs text-ink-400">Chase</div>
            </div>
            <div class="text-right">
              <div class="text-[10px] uppercase tracking-widest text-ink-400">net value</div>
              <div class="font-display text-2xl text-white">$45.00</div>
            </div>
          </div>
          <hr class="my-3 border-white/5" />
          <ul class="space-y-1.5">
            <li>1.5× flat on $3,000.00 = <span class="text-white">4,500 pts</span> <span class="text-ink-400">≈ $45.00</span></li>
          </ul>
        </article>
      </div>
    `;
    writeFileSync(path.join(OUT, "advisor-receipt.html"), wrap("Vault — Advisor", receiptHtml));
  });
});
