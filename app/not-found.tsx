import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="glass-card max-w-md p-10 text-center">
        <p className="text-xs uppercase tracking-widest text-ink-400">404</p>
        <h1 className="mt-2 font-display text-3xl">Lost in the wallet</h1>
        <p className="mt-2 text-sm text-ink-300">That page doesn&apos;t exist.</p>
        <Link href="/" className="btn-primary mt-6">Take me home</Link>
      </div>
    </main>
  );
}
