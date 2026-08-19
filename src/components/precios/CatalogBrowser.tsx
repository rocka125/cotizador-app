"use client";

import { useDeferredValue, useMemo, useState } from "react";
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
  { key: "precio_1yr" as const, years: 1, label: "1 año" },
  { key: "precio_2yr" as const, years: 2, label: "2 años" },
  { key: "precio_3yr" as const, years: 3, label: "3 años" },
  { key: "precio_4yr" as const, years: 4, label: "4 años" },
  { key: "precio_5yr" as const, years: 5, label: "5 años" },
];

function money(n: number) {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Años en los que se ofrece precio a plazo para TODO producto, aunque el
// Excel no traiga ese término explícito. Cuando el price list sí trae el
// precio real de contrato (p.ej. un bundle FortiCare a 3 años) se usa ese
// valor tal cual -- es el precio TOTAL del contrato, no uno a multiplicar.
// Cuando no lo trae (p.ej. hardware que solo tiene "Price" plano) se calcula
// como precio base × número de años, marcado como estimado para no
// confundirlo con un precio oficial de Fortinet.
const CALCULABLE_YEARS = [1, 2, 3] as const;

function availableTerms(it: CatalogItem) {
  const real = YEAR_COLS.filter((c) => it[c.key] != null).map((c) => ({ years: c.years, label: c.label, precio: it[c.key] as number, calculated: false }));

  const calculated = CALCULABLE_YEARS.filter((years) => !real.some((r) => r.years === years) && it.precio != null).map((years) => ({
    years,
    label: `${years} año${years > 1 ? "s" : ""}`,
    precio: (it.precio as number) * years,
    calculated: true,
  }));

  return [...real, ...calculated].sort((a, b) => a.years - b.years);
}

// "Precio normal" para la columna Precio -- el precio plano si lo hay; si el
// SKU es un bundle de soporte que solo tiene precio de contrato (sin Price
// plano en el Excel), se usa el precio de contrato más corto disponible
// como sustituto, marcado con su plazo para no hacerlo pasar por precio único.
function normalPrice(it: CatalogItem): { value: number; fromTerm: boolean; years?: number } | null {
  if (it.precio != null) return { value: it.precio, fromTerm: false };
  const real = YEAR_COLS.filter((c) => it[c.key] != null);
  if (real.length === 0) return null;
  const shortest = real.reduce((a, b) => (a.years < b.years ? a : b));
  return { value: it[shortest.key] as number, fromTerm: true, years: shortest.years };
}

const RESULT_CAP = 300;

export function CatalogBrowser({ items }: { items: CatalogItem[] }) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [activeCategoria, setActiveCategoria] = useState<string | null>(null);

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) m.set(it.categoria, (m.get(it.categoria) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const familyCount = useMemo(() => new Set(items.map((it) => it.unit_name || it.sku)).size, [items]);

  const filtered = useMemo(() => {
    const byCategoria = activeCategoria ? items.filter((it) => it.categoria === activeCategoria) : items;
    const bySearch = deferredSearch.trim()
      ? byCategoria.filter((it) => matchesProductQuery({ unitName: it.unit_name ?? "", sku: it.sku, descripcion: it.descripcion }, deferredSearch))
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
  }, [items, deferredSearch, activeCategoria]);

  // Only show the "Plazo" column at all if something in the CURRENT result
  // set actually has term pricing -- flat one-time-price-only categories
  // (accessories, transceivers...) never populate precio_Xyr.
  const anyTermPricing = useMemo(() => filtered.some((it) => availableTerms(it).length > 0), [filtered]);

  const capped = filtered.slice(0, RESULT_CAP);

  // Selected contract length per SKU, defaulting to the shortest term the
  // product actually offers (e.g. 1yr) so the calculated price column
  // always shows something meaningful without the user touching anything.
  const [selectedYears, setSelectedYears] = useState<Record<string, number>>({});

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
              border lines up into a single grid instead of doubled/gapped lines. */}
          <table className="w-full text-xs min-w-[760px]" style={{ borderCollapse: "collapse" }}>
            <thead className="sticky top-0 z-10">
              <tr style={{ background: "#232120" }}>
                {["SKU", "Descripción"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-semibold text-white/70 border" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                    {h}
                  </th>
                ))}
                <th className="text-right px-3 py-2.5 font-semibold text-white/70 border whitespace-nowrap" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  Precio
                </th>
                {anyTermPricing && (
                  <>
                    <th className="text-left px-3 py-2.5 font-semibold text-white/70 border whitespace-nowrap" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                      Plazo
                    </th>
                    <th className="text-right px-3 py-2.5 font-semibold text-white/70 border whitespace-nowrap" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                      Precio a plazo
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {capped.map((it, i) => {
                const terms = availableTerms(it);
                const chosenYears = selectedYears[it.sku] ?? terms[0]?.years;
                const chosen = terms.find((t) => t.years === chosenYears) ?? terms[0];
                const normal = normalPrice(it);
                return (
                  <tr key={`${it.sku}-${i}`} className="hover:bg-white/5 transition-colors">
                    <td className="px-3 py-2 font-mono border whitespace-nowrap" style={{ borderColor: "rgba(255,255,255,0.06)", color: "var(--shell-accent)" }}>
                      {it.sku}
                    </td>
                    <td className="px-3 py-2 text-white/55 border max-w-sm truncate" title={it.descripcion} style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                      {it.descripcion}
                    </td>
                    <td
                      className="px-3 py-2 text-right text-white font-medium tabular-nums border whitespace-nowrap"
                      style={{ borderColor: "rgba(255,255,255,0.06)" }}
                      title={normal?.fromTerm ? `Precio de contrato a ${normal.years} año${normal.years !== 1 ? "s" : ""} (este SKU no tiene precio plano)` : undefined}
                    >
                      {normal ? (
                        <>
                          ${money(normal.value)}
                          {normal.fromTerm && <span className="text-white/30 font-normal"> ({normal.years}a)</span>}
                        </>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                    {anyTermPricing && (
                      <>
                        <td className="px-3 py-2 border whitespace-nowrap" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                          {terms.length > 0 ? (
                            <select
                              value={chosen?.years}
                              onChange={(e) => setSelectedYears((prev) => ({ ...prev, [it.sku]: Number(e.target.value) }))}
                              className="bg-black/30 border border-white/10 rounded-md text-white text-xs px-2 py-1 focus:outline-none focus:border-[var(--shell-accent)]"
                            >
                              {terms.map((t) => (
                                <option key={t.years} value={t.years}>
                                  {t.label}
                                  {t.calculated ? " (estimado)" : ""}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-white/20">—</span>
                          )}
                        </td>
                        <td
                          className="px-3 py-2 text-right tabular-nums border whitespace-nowrap"
                          style={{ borderColor: "rgba(255,255,255,0.06)", color: chosen ? (chosen.calculated ? "rgba(90,163,255,0.6)" : "#5AA3FF") : "rgba(255,255,255,0.15)" }}
                          title={chosen?.calculated ? "Estimado: precio base × años (no es el precio oficial de contrato de Fortinet)" : undefined}
                        >
                          {chosen ? (
                            <>
                              {chosen.calculated ? "~" : ""}${money(chosen.precio)}
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
              {capped.length === 0 && (
                <tr>
                  <td colSpan={anyTermPricing ? 5 : 3} className="text-center py-10 text-white/30 border" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
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
