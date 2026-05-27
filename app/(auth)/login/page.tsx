import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Vault" };

export default function LoginPage() {
  return (
    <div className="glass-card p-8">
      <h1 className="font-display text-3xl">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-300">Sign in to your Vault.</p>
      <Suspense fallback={<div className="mt-6 h-32 rounded-xl bg-white/[0.02]" />}>
        <LoginForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-ink-300">
        New here?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
