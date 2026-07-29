import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import { ImportWizard } from "@/components/precios/ImportWizard";
import { VersionHistory } from "@/components/precios/VersionHistory";
import { CategoryBrowser, type ActivePriceItem } from "@/components/precios/CategoryBrowser";

export default async function PreciosPage() {
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";
  const supabase = await createClient();

  const { data: versions } = await supabase
    .from("price_list_versions")
    .select("id, nombre, descripcion, activa, total_skus, created_at")
    .order("created_at", { ascending: false });

  // active_price_list can hold 10k+ rows (a full Fortinet price sheet) --
  // a plain .select() silently truncates at PostgREST's 1000-row default,
  // which is exactly what was showing only ~1000 rows / 1 category before.
  const activeItems = await fetchAllRows<ActivePriceItem>(supabase, "active_price_list", "categoria, sku, descripcion, precio");

  const categorias = new Set(activeItems.map((i) => i.categoria));

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Productos activos</p>
          <p className="text-2xl font-bold text-white">{(activeItems ?? []).length.toLocaleString("es-MX")}</p>
        </div>
        <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Categorías</p>
          <p className="text-2xl font-bold text-white">{categorias.size}</p>
        </div>
        <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Versiones guardadas</p>
          <p className="text-2xl font-bold text-white">{(versions ?? []).length}</p>
        </div>
      </div>

      {isAdmin && <ImportWizard />}

      <div className="flex justify-end">
        <Link href="/precios/comparar" className="text-sm text-[var(--shell-accent)] hover:underline">
          Comparar versiones →
        </Link>
      </div>

      <VersionHistory versions={versions ?? []} isAdmin={isAdmin} />

      <CategoryBrowser items={activeItems ?? []} />
    </div>
  );
}
