"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

interface VersionOption {
  id: string;
  nombre: string;
  activa: boolean;
  total_skus: number;
}

interface DiffItem {
  sku: string;
  categoria: string;
  descripcion: string;
}
interface CambioItem extends DiffItem {
  precioAnterior: number;
  precioNuevo: number;
  delta: number;
  pct: number;
}
interface Diff {
  nuevos: DiffItem[];
  eliminados: DiffItem[];
  cambios: CambioItem[];
  igualesCount: number;
}

type Tab = "nuevos" | "eliminados" | "cambios";

export function ComparadorClient({
  versions,
  selectedA,
  selectedB,
  diff,
}: {
  versions: VersionOption[];
  selectedA?: string;
  selectedB?: string;
  diff: Diff | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("cambios");
  const [search, setSearch] = useState("");

  function updateSelection(a: string, b: string) {
    const params = new URLSearchParams();
    if (a) params.set("a", a);
    if (b) params.set("b", b);
    router.push(`/precios/comparar?${params.toString()}`);
  }

  const filtered = useMemo(() => {
    if (!diff) return [];
    const q = search.trim().toLowerCase();
    const list = tab === "nuevos" ? diff.nuevos : tab === "eliminados" ? diff.eliminados : diff.cambios;
    if (!q) return list;
    return list.filter((i) => i.sku.toLowerCase().includes(q) || i.descripcion.toLowerCase().includes(q));
  }, [diff, tab, search]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs text-white/50 mb-1">Versión A (anterior)</label>
          <select
            value={selectedA ?? ""}
            onChange={(e) => updateSelection(e.target.value, selectedB ?? "")}
            className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white min-w-[220px]"
          >
            <option value="">Seleccionar…</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nombre} {v.activa ? "(activa)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1">Versión B (nueva)</label>
          <select
            value={selectedB ?? ""}
            onChange={(e) => updateSelection(selectedA ?? "", e.target.value)}
            className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white min-w-[220px]"
          >
            <option value="">Seleccionar…</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nombre} {v.activa ? "(activa)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!diff && <p className="text-white/40 text-sm">Selecciona dos versiones para comparar.</p>}

      {diff && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border p-5" style={{ background: "rgba(74,222,128,0.06)", borderColor: "rgba(74,222,128,0.2)" }}>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Nuevos</p>
              <p className="text-2xl font-bold text-green-400">{diff.nuevos.length.toLocaleString("es-MX")}</p>
            </div>
            <div className="rounded-2xl border p-5" style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.2)" }}>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Eliminados</p>
              <p className="text-2xl font-bold text-red-400">{diff.eliminados.length.toLocaleString("es-MX")}</p>
            </div>
            <div className="rounded-2xl border p-5" style={{ background: "rgba(245,158,11,0.06)", borderColor: "rgba(245,158,11,0.2)" }}>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Cambios de precio</p>
              <p className="text-2xl font-bold text-amber-400">{diff.cambios.length.toLocaleString("es-MX")}</p>
            </div>
            <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Iguales</p>
              <p className="text-2xl font-bold text-white">{diff.igualesCount.toLocaleString("es-MX")}</p>
            </div>
          </div>

          <div className="rounded-2xl border p-6" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex gap-1 rounded-full bg-white/5 border border-white/10 p-1">
                {(["cambios", "nuevos", "eliminados"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                    style={{
                      background: tab === t ? "var(--shell-accent)" : "transparent",
                      color: tab === t ? "#fff" : "rgba(255,255,255,0.6)",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar SKU o descripción…"
                className="bg-black/30 border border-white/10 rounded-full px-4 py-1.5 text-xs text-white w-64"
              />
            </div>

            <div className="max-h-96 overflow-y-auto overflow-x-auto rounded-lg border border-white/5">
              <table className="w-full min-w-[520px] text-xs">
                <thead className="sticky top-0 bg-black/60 backdrop-blur">
                  <tr className="text-white/40">
                    <th className="text-left px-3 py-2">SKU</th>
                    <th className="text-left px-3 py-2">Descripción</th>
                    {tab === "cambios" ? (
                      <>
                        <th className="text-right px-3 py-2">Antes</th>
                        <th className="text-right px-3 py-2">Ahora</th>
                        <th className="text-right px-3 py-2">Δ%</th>
                      </>
                    ) : (
                      <th className="text-left px-3 py-2">Categoría</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((it, i) => (
                    <tr key={`${it.sku}-${i}`} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-3 py-2 font-mono text-white/80">{it.sku}</td>
                      <td className="px-3 py-2 text-white/60 max-w-xs truncate">{it.descripcion}</td>
                      {tab === "cambios" && "precioAnterior" in it ? (
                        <>
                          <td className="px-3 py-2 text-right text-white/50">${(it as CambioItem).precioAnterior.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right text-white">${(it as CambioItem).precioNuevo.toFixed(2)}</td>
                          <td
                            className="px-3 py-2 text-right font-semibold"
                            style={{ color: (it as CambioItem).pct >= 0 ? "#4ade80" : "#ef4444" }}
                          >
                            {(it as CambioItem).pct >= 0 ? "+" : ""}
                            {(it as CambioItem).pct.toFixed(1)}%
                          </td>
                        </>
                      ) : (
                        <td className="px-3 py-2 text-white/50">{it.categoria}</td>
                      )}
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-white/30">
                        Sin resultados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
