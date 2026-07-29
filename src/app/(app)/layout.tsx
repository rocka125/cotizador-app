import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { AppShell } from "@/components/shell/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  // proxy.ts already gates "is there a session at all" — this is the
  // authoritative per-page layer (see plan's layered security model).
  if (!profile) {
    redirect("/login");
  }

  return (
    <AppShell role={profile.role} userEmail={profile.email} userName={profile.nombre}>
      {children}
    </AppShell>
  );
}
