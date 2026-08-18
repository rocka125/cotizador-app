import { createClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/supabase/fetchAll";
import { CatalogBrowser, type CatalogItem } from "@/components/precios/CatalogBrowser";

// Separate from /precios on purpose: that page is the admin import/manage
// tool (ImportWizard + VersionHistory), this one is a clean, sales-facing
// "browse & search the current price list" page -- nothing about managing
// versions, just finding a product fast while building a quote.
export default async function CatalogoPage() {
  const supabase = await createClient();

  // active_price_list can hold 10k+ rows (a full Fortinet price sheet) -- a
  // plain .select() silently truncates at PostgREST's 1000-row default.
  const items = await fetchAllRows<CatalogItem>(
    supabase,
    "active_price_list",
    "categoria, sku, descripcion, unit_name, precio, precio_1yr, precio_2yr, precio_3yr, precio_4yr, precio_5yr"
  );

  return (
    <div className="p-6 space-y-4">
      <div className="px-1">
        <h1 className="text-2xl font-serif italic text-white mb-1">Catálogo de productos</h1>
        <p className="text-white/50 text-sm">
          Busca por modelo (p. ej. &quot;FortiGate 60F&quot;) y compara precio por año de contrato antes de agregar a una cotización.
        </p>
      </div>
      <CatalogBrowser items={items} />
    </div>
  );
}
