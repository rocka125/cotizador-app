"use client";

import { useState, useTransition } from "react";
import { activateVersion, deleteVersion } from "@/app/(app)/precios/actions";

export interface PriceListVersionRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
  total_skus: number;
  created_at: string;
}

export function VersionHistory({ versions, isAdmin }: { versions: PriceListVersionRow[]; isAdmin: boolean }) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleActivate(id: string) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      try {
        await activateVersion(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al activar");
      } finally {
        setBusyId(null);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta versión archivada? Esta acción no se puede deshacer.")) return;
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      try {
        await deleteVersion(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al eliminar");
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <div className="rounded-2xl border p-6" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
      <h3 className="text-sm font-semibold text-white/70 mb-4">Historial de versiones</h3>
      {error && <div className="mb-3 text-xs text-red-400 bg-red-500/10 rounded-lg p-2">{error}</div>}
      <div className="space-y-2">
        {versions.map((v) => (
          <div key={v.id} className="flex items-center justify-between gap-3 bg-white/5 rounded-xl px-4 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm text-white truncate">{v.nombre}</p>
                {v.activa && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 shrink-0">
                    Activa
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40">
                {v.total_skus.toLocaleString("es-MX")} SKUs · {new Date(v.created_at).toLocaleDateString("es-MX")}
              </p>
            </div>
            {isAdmin && (
              <div className="flex gap-2 shrink-0">
                {!v.activa && (
                  <button
                    disabled={pending && busyId === v.id}
                    onClick={() => handleActivate(v.id)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium disabled:opacity-40"
                  >
                    Activar
                  </button>
                )}
                {!v.activa && (
                  <button
                    disabled={pending && busyId === v.id}
                    onClick={() => handleDelete(v.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium disabled:opacity-40"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
