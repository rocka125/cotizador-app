import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import { ComparadorClient } from "@/components/precios/ComparadorClient";

interface PriceListItemRow {
  sku: string;
  categoria: string;
  descripcion: string;
  precio: string;
}

export default async function CompararListasPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { a, b } = await searchParams;
  const supabase = await createClient();

  const { data: versions } = await supabase
    .from("price_list_versions")
    .select("id, nombre, activa, total_skus, created_at")
    .order("created_at", { ascending: false });

  let diff = null;
  if (a && b) {
    // Each version can hold 10k+ rows -- a plain .select() truncates at
    // PostgREST's 1000-row default, which silently produced a wrong diff
    // (comparing only the first 1000 rows of each version) before this fix.
    const [itemsA, itemsB] = await Promise.all([
      fetchAllRows<PriceListItemRow>(supabase, "price_list_items", "sku, categoria, descripcion, precio", { version_id: a }),
      fetchAllRows<PriceListItemRow>(supabase, "price_list_items", "sku, categoria, descripcion, precio", { version_id: b }),
    ]);

    const mapA = new Map(itemsA.map((i) => [i.sku, i]));
    const mapB = new Map(itemsB.map((i) => [i.sku, i]));

    const nuevos = [...mapB.values()].filter((i) => !mapA.has(i.sku));
    const eliminados = [...mapA.values()].filter((i) => !mapB.has(i.sku));
    const cambios = [...mapB.values()]
      .filter((i) => mapA.has(i.sku) && Number(mapA.get(i.sku)!.precio) !== Number(i.precio))
      .map((i) => {
        const before = Number(mapA.get(i.sku)!.precio);
        const after = Number(i.precio);
        return {
          sku: i.sku,
          categoria: i.categoria,
          descripcion: i.descripcion,
          precioAnterior: before,
          precioNuevo: after,
          delta: after - before,
          pct: before !== 0 ? ((after - before) / before) * 100 : 0,
        };
      })
      .sort((x, y) => Math.abs(y.pct) - Math.abs(x.pct));
    const igualesCount = [...mapB.values()].filter((i) => mapA.has(i.sku) && Number(mapA.get(i.sku)!.precio) === Number(i.precio)).length;

    diff = { nuevos, eliminados, cambios, igualesCount };
  }

  return <ComparadorClient versions={versions ?? []} selectedA={a} selectedB={b} diff={diff} />;
}
