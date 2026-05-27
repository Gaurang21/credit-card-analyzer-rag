import { AddCardWizard } from "./wizard";

export const metadata = { title: "Add card · Vault" };

export default function NewCardPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="chip">New card</p>
        <h1 className="mt-2 font-display text-4xl">Add a card to your wallet</h1>
        <p className="mt-1 text-sm text-ink-300">Type it, fetch it by name, or upload the terms PDF.</p>
      </header>
      <AddCardWizard />
    </div>
  );
}
