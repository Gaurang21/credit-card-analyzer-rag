import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5">
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-soft via-accent to-accent-deep shadow-glow">
        <span className="absolute inset-[2px] rounded-[10px] bg-ink-950/80" />
        <span className="relative font-display text-lg font-bold gold-text">V</span>
      </span>
      <span className="font-display text-lg tracking-tight">
        Vault<span className="ml-1 text-ink-400 text-sm font-sans">advisor</span>
      </span>
    </Link>
  );
}
