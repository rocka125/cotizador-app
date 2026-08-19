"use client";

import { useMemo, useState } from "react";

export interface ActivePriceItem {
  categoria: string;
  sku: string;
  descripcion: string;
  precio: number | null;
}

export function CategoryBrowser({ items }: { items: ActivePriceItem[] }) {
  const [search, setSearch] = useState("");
  const [activeCategoria, setActiveCategoria] = useState<string | null>(null);

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) m.set(it.categoria, (m.get(it.categoria) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((it) => (!activeCategoria || it.categoria === activeCategoria) && (!q || it.sku.toLowerCase().includes(q) || it.descripcion.toLowerCase().includes(q)))
      .slice(0, 200);
  }, [items, search, activeCategoria]);

  return (
    <div className="rounded-2xl border p-6" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white/70">Catálogo activo</h3>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar SKU o descripción…"
          className="bg-black/30 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white w-64"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setActiveCategoria(null)}
          className="text-xs px-3 py-1 rounded-full font-medium"
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
            onClick={() => setActiveCategoria(cat)}
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={{
              background: activeCategoria === cat ? "var(--shell-accent)" : "rgba(255,255,255,0.06)",
              color: activeCategoria === cat ? "#fff" : "rgba(255,255,255,0.5)",
            }}
          >
            {cat} ({count.toLocaleString("es-MX")})
          </button>
        ))}
      </div>

      <div className="max-h-96 overflow-y-auto overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-black/60 backdrop-blur">
            <tr className="text-white/40">
              <th className="text-left px-3 py-2">SKU</th>
              <th className="text-left px-3 py-2">Descripción</th>
              <th className="text-right px-3 py-2">Precio USD</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((it, i) => (
              <tr key={`${it.sku}-${i}`} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-3 py-2 font-mono text-white/80">{it.sku}</td>
                <td className="px-3 py-2 text-white/60 max-w-xs truncate">{it.descripcion}</td>
                <td className="px-3 py-2 text-right text-white font-medium">
                  {it.precio != null ? `$${it.precio.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : <span className="text-white/20">—</span>}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-white/30">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {filtered.length === 200 && <p className="text-center text-white/30 text-[10px] py-2">Mostrando los primeros 200 resultados</p>}
      </div>
    </div>
  );
}
