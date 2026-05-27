import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen flex-col">
      <header className="px-6 py-6">
        <Logo />
      </header>
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-md animate-slide-up">{children}</div>
      </div>
    </main>
  );
}
