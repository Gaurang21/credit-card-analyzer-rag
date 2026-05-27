"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function DeleteCardButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function onDelete() {
    if (!confirm("Delete this card? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await fetch(`/api/cards/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/cards");
        router.refresh();
      }
    });
  }

  return (
    <button onClick={onDelete} disabled={pending} className="btn-ghost text-red-300">
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
