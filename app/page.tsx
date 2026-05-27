import Link from "next/link";
import { Logo } from "@/components/logo";

export default function MarketingHome() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-quiet">
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary">
            Get started
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-24 pt-10 md:grid-cols-2 md:pt-20">
        <div className="animate-slide-up">
          <p className="chip">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-glow" /> Private RAG · local LLM
          </p>
          <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-tight md:text-6xl">
            Use the <span className="gold-text">right card</span>,
            <br />
            every time.
          </h1>
          <p className="mt-6 max-w-md text-lg text-ink-300">
            Vault learns your wallet, then tells you which card to swipe for any purchase — with
            the math shown, the fees flagged, and the trade-offs spelled out.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="btn-primary">
              Build your wallet →
            </Link>
            <Link href="/login" className="btn-ghost">
              I already have an account
            </Link>
          </div>
          <ul className="mt-10 grid gap-3 text-sm text-ink-300">
            <Feature>Three ways to add cards: type, fetch from web, or upload terms PDF.</Feature>
            <Feature>Natural-language advisor: &ldquo;$3k MacBook?&rdquo; → ranked answer.</Feature>
            <Feature>Math receipt for every recommendation. No black box.</Feature>
          </ul>
        </div>

        <div className="relative">
          <FloatingCardStack />
        </div>
      </section>

      <footer className="border-t border-white/5 px-6 py-6 text-center text-xs text-ink-400">
        Vault · built for the curious wallet
      </footer>
    </main>
  );
}

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-accent" />
      <span>{children}</span>
    </li>
  );
}

function FloatingCardStack() {
  return (
    <div className="relative mx-auto h-[420px] w-full max-w-sm">
      <FauxCard
        className="absolute left-2 top-0 rotate-[-6deg]"
        title="Sapphire Preferred"
        sub="3× travel · 2× dining"
        accent="from-indigo-500/30 to-transparent"
      />
      <FauxCard
        className="absolute left-10 top-20 rotate-[2deg]"
        title="Amex Gold"
        sub="4× dining · 4× groceries"
        accent="from-amber-500/30 to-transparent"
      />
      <FauxCard
        className="absolute left-4 top-44 rotate-[-3deg]"
        title="Citi Custom Cash"
        sub="5% top category"
        accent="from-sky-500/30 to-transparent"
      />
      <FauxCard
        className="absolute left-12 top-64 rotate-[5deg]"
        title="Freedom Unlimited"
        sub="1.5% everywhere"
        accent="from-emerald-500/30 to-transparent"
      />
    </div>
  );
}

function FauxCard({
  className,
  title,
  sub,
  accent,
}: {
  className?: string;
  title: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className={`card-face w-72 ${className ?? ""}`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-tr ${accent}`} />
      <div className="flex items-start justify-between">
        <div className="card-chip" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-ink-300">Vault</span>
      </div>
      <div className="mt-12">
        <p className="font-display text-xl text-white">{title}</p>
        <p className="mt-1 text-xs text-ink-300">{sub}</p>
      </div>
    </div>
  );
}
