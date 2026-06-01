"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Wallet, Sparkles, CreditCard, History, type LucideIcon } from "lucide-react";
import { Logo } from "@/components/logo";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Wallet", icon: Wallet },
  { href: "/advisor", label: "Advisor", icon: Sparkles },
  { href: "/cards", label: "Cards", icon: CreditCard },
  { href: "/history", label: "History", icon: History },
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
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors min-h-[44px]",
                  active ? "bg-white/[0.07] text-white shadow-inset" : "text-ink-300 hover:bg-white/[0.04] hover:text-white",
                )}
              >
                <Icon className="h-5 w-5 text-accent" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
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
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium uppercase tracking-widest",
                active ? "text-white" : "text-ink-400",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-accent")} strokeWidth={active ? 2.2 : 1.8} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
