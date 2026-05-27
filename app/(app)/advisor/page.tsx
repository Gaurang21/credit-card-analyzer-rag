import { AdvisorChat } from "./chat";

export const metadata = { title: "Advisor · Vault" };

const SAMPLE_PROMPTS = [
  "I'm buying a $3,000 MacBook — which card gives the best return?",
  "Traveling to Japan next month — which card avoids foreign txn fees?",
  "$120 dinner tonight at a steakhouse, which card?",
  "Groceries run, about $250 at Whole Foods — what should I swipe?",
];

export default function AdvisorPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="chip">Advisor</p>
        <h1 className="mt-2 font-display text-4xl">Which card should I use?</h1>
        <p className="mt-1 text-sm text-ink-300">
          Ask in plain English. Vault pulls from your wallet, looks up the merchant, and shows the math.
        </p>
      </header>

      <AdvisorChat samples={SAMPLE_PROMPTS} />
    </div>
  );
}
