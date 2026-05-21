// components/PriceListViewer.tsx
// Vista de la lista de precios en el dashboard
"use client";

import { useState, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface PriceItem {
  id: number;
  sheet: string;
  sku: string;
  desc: string;
  price: number;
}

export function PriceListViewer() {
  const supabase = createClient();
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeSheet, setActiveSheet] = useState("Todos");
  const [sortBy, setSortBy] = useState<"sku" | "price" | "sheet">("sheet");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => {
    setLoading(true);
    supabase
      .from("price_list")
      .select("id, sheet, sku, desc, price")
      .order("sheet")
      .order("sku")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setItems((data as PriceItem[]) ?? []);
        setLoading(false);
      });
  }, []);

  const sheets = useMemo(() => {
    const s = Array.from(new Set(items.map((p) => p.sheet))).sort();
    return ["Todos", ...s];
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = items.filter((p) => {
      const matchSheet = activeSheet === "Todos" || p.sheet === activeSheet;
      const matchSearch =
        !q ||
        p.sku.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q);
      return matchSheet && matchSearch;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "sku") cmp = a.sku.localeCompare(b.sku);
      else if (sortBy === "price") cmp = a.price - b.price;
      else cmp = a.sheet.localeCompare(b.sheet) || a.sku.localeCompare(b.sku);
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [items, search, activeSheet, sortBy, sortDir]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  function toggleSort(col: "sku" | "price" | "sheet") {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortDir("asc"); }
    setPage(0);
  }

  function handleSearch(v: string) { setSearch(v); setPage(0); }
  function handleSheet(s: string) { setActiveSheet(s); setPage(0); }

  const SortIcon = ({ col }: { col: string }) =>
    sortBy === col ? (
      <span className="ml-1 text-orange-400">{sortDir === "asc" ? "↑" : "↓"}</span>
    ) : (
      <span className="ml-1 text-gray-600">↕</span>
    );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <svg className="animate-spin mr-3 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#D95A00" strokeWidth="4"/>
          <path className="opacity-75" fill="#D95A00" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Cargando lista de precios…
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400">
        <p className="font-semibold">Error al cargar la lista</p>
        <p className="text-sm mt-1 font-mono">{error}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">No hay lista de precios cargada aún.</p>
        <a
          href="/admin/precios"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Subir Excel de precios
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Lista de precios</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {items.length.toLocaleString()} productos · {sheets.length - 1} categorías
          </p>
        </div>
        <a
          href="/admin/precios"
          className="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 border border-orange-500/30 hover:border-orange-500/60 px-4 py-2 rounded-lg transition-colors"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Actualizar lista
        </a>
      </div>

      {/* Buscador */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar por SKU o descripción…"
          className="w-full bg-gray-900/60 border border-orange-500/20 focus:border-orange-500/60 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder:text-gray-600 focus:outline-none transition-colors"
        />
        {search && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >×</button>
        )}
      </div>

      {/* Filtros por categoría */}
      <div className="flex flex-wrap gap-2">
        {sheets.map((s) => (
          <button
            key={s}
            onClick={() => handleSheet(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              activeSheet === s
                ? "bg-orange-500/20 border-orange-500 text-orange-400 font-semibold"
                : "border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300"
            }`}
          >
            {s}
            {s !== "Todos" && (
              <span className="ml-1.5 opacity-60">
                {items.filter((i) => i.sheet === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contador de resultados */}
      <p className="text-xs text-gray-500">
        {filtered.length === items.length
          ? `${items.length.toLocaleString()} productos`
          : `${filtered.length.toLocaleString()} de ${items.length.toLocaleString()} productos`}
        {filtered.length > PAGE_SIZE && ` · página ${page + 1} de ${totalPages}`}
      </p>

      {/* Tabla */}
      <div className="bg-gray-900/50 border border-orange-500/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-orange-500/20">
                <th
                  className="text-left px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors select-none"
                  onClick={() => toggleSort("sheet")}
                >
                  Categoría <SortIcon col="sheet" />
                </th>
                <th
                  className="text-left px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors select-none"
                  onClick={() => toggleSort("sku")}
                >
                  SKU <SortIcon col="sku" />
                </th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">
                  Descripción
                </th>
                <th
                  className="text-right px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-white transition-colors select-none"
                  onClick={() => toggleSort("price")}
                >
                  Precio USD <SortIcon col="price" />
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500">
                    Sin resultados para "{search}"
                  </td>
                </tr>
              ) : (
                paginated.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-800/50 hover:bg-orange-500/5 transition-colors ${
                      idx % 2 === 0 ? "" : "bg-gray-900/30"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full">
                        {item.sheet}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-300">{item.sku}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate" title={item.desc}>
                      {item.desc}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400 font-mono font-semibold">
                      $
                      {item.price.toLocaleString("es-MX", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Anterior
            </button>
            <span className="text-xs text-gray-500">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="text-sm text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}