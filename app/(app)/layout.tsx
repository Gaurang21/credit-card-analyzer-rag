import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supa = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supa.auth.getUser().catch(() => ({ data: { user: null } }));
  if (!user) redirect("/login");

  return <AppShell email={user.email ?? "you@vault"}>{children}</AppShell>;
}
