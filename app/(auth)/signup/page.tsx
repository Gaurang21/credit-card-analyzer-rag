import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Sign up · Vault" };

export default function SignupPage() {
  return (
    <div className="glass-card p-8">
      <h1 className="font-display text-3xl">Build your Vault</h1>
      <p className="mt-2 text-sm text-ink-300">Create an account in seconds.</p>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-ink-300">
        Already a member?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
