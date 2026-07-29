import { listQuotes } from "@/lib/quotes/data";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { createClient } from "@/lib/supabase/server";
import { DossierGrid } from "@/components/cotizaciones/DossierGrid";
import type { EstadoCotizacion } from "@/lib/quotes/types";

export default async function CotizacionesListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; page?: string }>;
}) {
  const { q, estado, page } = await searchParams;
  const profile = await getCurrentProfile();
  const pageNum = Math.max(1, Number(page) || 1);

  const { items, total, pageSize } = await listQuotes({
    search: q,
    estado: (estado as EstadoCotizacion | "todas") ?? "todas",
    page: pageNum,
  });

  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("id, nombre, email");
  const profilesById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  return (
    <DossierGrid
      quotes={items}
      profilesById={profilesById}
      total={total}
      page={pageNum}
      pageSize={pageSize}
      isAdmin={profile?.role === "admin"}
      currentUserId={profile?.id ?? ""}
    />
  );
}
