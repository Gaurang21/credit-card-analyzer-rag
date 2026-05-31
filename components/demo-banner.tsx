import { DEMO_MODE } from "@/lib/demo/flag";

export function DemoBanner() {
  if (!DEMO_MODE) return null;
  return (
    <div className="border-b border-accent/30 bg-accent/[0.06] px-4 py-2 text-center text-xs text-accent-soft">
      <span className="font-medium">Demo mode</span> · using an in-memory wallet and canned LLM responses · sign-up &amp; sign-in are auto-confirmed
    </div>
  );
}
