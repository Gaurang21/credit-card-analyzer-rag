"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Logo } from "@/components/logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  { href: "/dashboard", label: "Wallet", icon: (a) => <WalletIcon active={a} /> },
  { href: "/advisor", label: "Advisor", icon: (a) => <SparkIcon active={a} /> },
  { href: "/cards", label: "Cards", icon: (a) => <StackIcon active={a} /> },
  { href: "/history", label: "History", icon: (a) => <ClockIcon active={a} /> },
];

export function AppShell({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onSignOut = () =>
    startTransition(async () => {
      const supa = createSupabaseBrowserClient();
      await supa.auth.signOut();
      router.push("/");
      router.refresh();
    });

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-white/5 bg-ink-950/60 p-5 md:flex">
        <Logo />
        <nav className="mt-10 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors min-h-[44px]",
                  active ? "bg-white/[0.07] text-white shadow-inset" : "text-ink-300 hover:bg-white/[0.04] hover:text-white",
                )}
              >
                <span className="text-accent">{item.icon(active)}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto rounded-xl border border-white/5 bg-white/[0.02] p-3">
          <div className="text-xs text-ink-400">Signed in as</div>
          <div className="truncate text-sm text-white">{email}</div>
          <button
            type="button"
            onClick={onSignOut}
            disabled={pending}
            className="btn-quiet mt-2 w-full justify-start text-xs"
          >
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 pb-24 md:pb-0">
        <header className="flex items-center justify-between border-b border-white/5 bg-ink-950/60 px-5 py-4 md:hidden">
          <Logo />
          <button onClick={onSignOut} className="text-xs text-ink-300">Sign out</button>
        </header>
        <div className="mx-auto max-w-5xl px-5 py-6 md:px-8 md:py-10 animate-fade-in">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-white/5 bg-ink-950/90 backdrop-blur-lg md:hidden">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium uppercase tracking-widest",
                active ? "text-white" : "text-ink-400",
              )}
            >
              <span className={active ? "text-accent" : ""}>{item.icon(active)}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function WalletIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 10h18" />
      <circle cx="16" cy="14.5" r="1" />
    </svg>
  );
}
function SparkIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="M5.6 5.6 8 8" />
      <path d="M16 16l2.4 2.4" />
      <path d="M5.6 18.4 8 16" />
      <path d="M16 8l2.4-2.4" />
    </svg>
  );
}
function StackIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="6" rx="2" />
      <rect x="3" y="14" width="18" height="6" rx="2" />
    </svg>
  );
}
function ClockIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
