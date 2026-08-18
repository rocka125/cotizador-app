"use client";

import { useMemo, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import { matchesProductQuery } from "@/lib/priceList/searchProducts";

export interface CatalogItem {
  categoria: string;
  sku: string;
  descripcion: string;
  unit_name: string | null;
  precio: number | null;
  precio_1yr: number | null;
  precio_2yr: number | null;
  precio_3yr: number | null;
  precio_4yr: number | null;
  precio_5yr: number | null;
}

const YEAR_COLS = [
  { key: "precio_1yr" as const, label: "1 Año" },
  { key: "precio_2yr" as const, label: "2 Años" },
  { key: "precio_3yr" as const, label: "3 Años" },
  { key: "precio_4yr" as const, label: "4 Años" },
  { key: "precio_5yr" as const, label: "5 Años" },
];

function money(n: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const RESULT_CAP = 300;

export function CatalogBrowser({ items }: { items: CatalogItem[] }) {
  const [search, setSearch] = useState("");
  const [activeCategoria, setActiveCategoria] = useState<string | null>(null);

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) m.set(it.categoria, (m.get(it.categoria) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const familyCount = useMemo(() => new Set(items.map((it) => it.unit_name || it.sku)).size, [items]);

  const filtered = useMemo(() => {
    const byCategoria = activeCategoria ? items.filter((it) => it.categoria === activeCategoria) : items;
    const bySearch = search.trim()
      ? byCategoria.filter((it) => matchesProductQuery({ unitName: it.unit_name ?? "", sku: it.sku, descripcion: it.descripcion }, search))
      : byCategoria;
    // Sorted so same-family SKUs (hardware + its FortiCare/FortiGuard terms)
    // land next to each other -- that's what makes the repeated-name
    // suppression below read as "grouped by product" without needing a
    // separate collapsible-group UI.
    return [...bySearch].sort((a, b) => {
      const fa = a.unit_name || a.sku;
      const fb = b.unit_name || b.sku;
      return fa === fb ? a.sku.localeCompare(b.sku) : fa.localeCompare(fb);
    });
  }, [items, search, activeCategoria]);

  // Only show a term-price column if something in the CURRENT result set
  // actually uses it -- this list only ever populates 1/3/5yr, so showing
  // permanently-empty "2 Años"/"4 Años" columns would just be visual noise.
  const visibleYearCols = useMemo(
    () => YEAR_COLS.filter((c) => filtered.some((it) => it[c.key] != null)),
    [filtered]
  );

  const capped = filtered.slice(0, RESULT_CAP);

  // Real merged cells (rowSpan), like the source Excel's UNIT column --
  // computed once here instead of re-scanning neighbors during render.
  const groupedRows = useMemo(() => {
    const out: { item: CatalogItem; isGroupStart: boolean; groupSize: number }[] = [];
    for (let i = 0; i < capped.length; i++) {
      const family = capped[i].unit_name || capped[i].sku;
      const prevFamily = i > 0 ? capped[i - 1].unit_name || capped[i - 1].sku : null;
      const isGroupStart = family !== prevFamily;
      let groupSize = 1;
      if (isGroupStart) {
        for (let j = i + 1; j < capped.length && (capped[j].unit_name || capped[j].sku) === family; j++) groupSize++;
      }
      out.push({ item: capped[i], isGroupStart, groupSize });
    }
    return out;
  }, [capped]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Busca por nombre: FortiGate 60F, FortiSwitch 108, FortiAnalyzer 150…"
              className="w-full rounded-full bg-black/30 border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--shell-accent)]"
            />
          </div>
          <div className="flex gap-4 text-xs text-white/40 shrink-0 px-1">
            <span>
              <b className="text-white font-semibold">{items.length.toLocaleString("es-MX")}</b> productos
            </span>
            <span>
              <b className="text-white font-semibold">{familyCount.toLocaleString("es-MX")}</b> modelos
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setActiveCategoria(null)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
            style={{
              background: activeCategoria === null ? "var(--shell-accent)" : "rgba(255,255,255,0.06)",
              color: activeCategoria === null ? "#fff" : "rgba(255,255,255,0.5)",
            }}
          >
            Todas ({items.length.toLocaleString("es-MX")})
          </button>
          {categoryCounts.map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setActiveCategoria(cat === activeCategoria ? null : cat)}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
              style={{
                background: activeCategoria === cat ? "var(--shell-accent)" : "rgba(255,255,255,0.06)",
                color: activeCategoria === cat ? "#fff" : "rgba(255,255,255,0.5)",
              }}
            >
              {cat} ({count.toLocaleString("es-MX")})
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="overflow-x-auto">
          {/* Real spreadsheet grid -- border-collapse so every cell's own
              border lines up into a single grid instead of doubled/gapped
              lines, and the Producto column uses a genuine rowSpan merged
              cell per product family, same as the source Excel's UNIT column. */}
          <table className="w-full text-xs min-w-[760px]" style={{ borderCollapse: "collapse" }}>
            <thead className="sticky top-0 z-10">
              <tr style={{ background: "#232120" }}>
                {["Producto", "SKU", "Descripción"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-semibold text-white/70 border" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                    {h}
                  </th>
                ))}
                <th className="text-right px-3 py-2.5 font-semibold text-white/70 border whitespace-nowrap" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  Precio
                </th>
                {visibleYearCols.map((c) => (
                  <th key={c.key} className="text-right px-3 py-2.5 font-semibold text-white/70 border whitespace-nowrap" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedRows.map(({ item: it, isGroupStart, groupSize }, i) => (
                <tr key={`${it.sku}-${i}`} className="hover:bg-white/5 transition-colors">
                  {isGroupStart && (
                    <td
                      rowSpan={groupSize}
                      className="px-4 py-2 align-top font-semibold text-white border whitespace-nowrap"
                      style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
                    >
                      {it.unit_name || <span className="text-white/30 italic font-normal">—</span>}
                    </td>
                  )}
                  <td className="px-3 py-2 font-mono border whitespace-nowrap" style={{ borderColor: "rgba(255,255,255,0.06)", color: "var(--shell-accent)" }}>
                    {it.sku}
                  </td>
                  <td className="px-3 py-2 text-white/55 border max-w-sm truncate" title={it.descripcion} style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    {it.descripcion}
                  </td>
                  <td className="px-3 py-2 text-right text-white font-medium tabular-nums border whitespace-nowrap" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    {it.precio != null ? `$${money(it.precio)}` : <span className="text-white/20">—</span>}
                  </td>
                  {visibleYearCols.map((c) => (
                    <td
                      key={c.key}
                      className="px-3 py-2 text-right tabular-nums border whitespace-nowrap"
                      style={{ borderColor: "rgba(255,255,255,0.06)", color: it[c.key] != null ? "#5AA3FF" : "rgba(255,255,255,0.15)" }}
                    >
                      {it[c.key] != null ? `$${money(it[c.key] as number)}` : "—"}
                    </td>
                  ))}
                </tr>
              ))}
              {capped.length === 0 && (
                <tr>
                  <td colSpan={4 + visibleYearCols.length} className="text-center py-10 text-white/30 border" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    Sin resultados{search ? ` para "${search}"` : ""}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > RESULT_CAP && (
          <p className="text-center text-white/30 text-[10px] py-2.5 border-t border-white/5">
            Mostrando los primeros {RESULT_CAP} de {filtered.length.toLocaleString("es-MX")} resultados — afina la búsqueda para ver más.
          </p>
        )}
      </div>
    </div>
  );
}
