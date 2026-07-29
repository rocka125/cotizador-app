import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { getDashboardStats } from "@/lib/quotes/data";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  const stats = await getDashboardStats();

  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("id, nombre, email");
  const profilesById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return (
    <DashboardClient
      stats={stats}
      profilesById={profilesById}
      userName={profile?.nombre || profile?.email?.split("@")[0] || "Usuario"}
    />
  );
}
