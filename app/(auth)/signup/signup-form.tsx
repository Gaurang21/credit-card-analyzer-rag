"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const supa = createSupabaseBrowserClient();
      const { data, error } = await supa.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setNotice("Check your email to confirm your account, then sign in.");
      }
    });
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit} data-testid="signup-form">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" type="password" required minLength={6} autoComplete="new-password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="mt-1 text-xs text-ink-400">At least 6 characters.</p>
      </div>
      {error ? (
        <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>
      ) : null}
      {notice ? (
        <div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{notice}</div>
      ) : null}
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
