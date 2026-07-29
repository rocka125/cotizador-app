"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { AuditLogRow } from "@/lib/quotes/data";

const ACCION_COLOR: Record<string, string> = {
  crear: "#4ade80",
  editar: "#60a5fa",
  eliminar: "#ef4444",
  cambio_estado: "#f59e0b",
  enviar_email: "#a78bfa",
  login: "#4ade80",
  logout: "#9ca3af",
};

export function AuditTimeline({
  items,
  total,
  page,
  pageSize,
  currentTipo,
}: {
  items: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
  currentTipo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null) params.delete(k);
      else params.set(k, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="rounded-2xl border p-6" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
      <div className="flex gap-1 rounded-full bg-white/5 border border-white/10 p-1 mb-4 w-fit">
        {["todo", "sesiones", "cotizaciones"].map((t) => {
          const value = t === "sesiones" ? "sesion" : t === "cotizaciones" ? "cotizacion" : "todo";
          return (
            <button
              key={t}
              onClick={() => updateParams({ tipo: value === "todo" ? null : value, page: null })}
              className="px-3 py-1 rounded-full text-xs font-medium capitalize"
              style={{
                background: currentTipo === value ? "var(--shell-accent)" : "transparent",
                color: currentTipo === value ? "#fff" : "rgba(255,255,255,0.6)",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="space-y-1">
        {items.length === 0 && <p className="text-center text-white/30 text-sm py-8">Sin registros.</p>}
        {items.map((r) => (
          <div key={r.id} className="flex items-start gap-3 px-2 py-2.5 rounded-lg hover:bg-white/5 border-b border-white/5 last:border-0">
            <span
              className="mt-1 w-2 h-2 rounded-full shrink-0"
              style={{ background: ACCION_COLOR[r.accion] ?? "#9ca3af" }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white">
                <span className="font-semibold">{r.usuario_nombre}</span>{" "}
                <span
                  className="text-xs font-bold uppercase px-1.5 py-0.5 rounded"
                  style={{ background: `${ACCION_COLOR[r.accion] ?? "#9ca3af"}22`, color: ACCION_COLOR[r.accion] ?? "#9ca3af" }}
                >
                  {r.accion}
                </span>
                {r.numero_cotizacion && <span className="text-white/50 ml-2 font-mono text-xs">{r.numero_cotizacion}</span>}
              </p>
              {r.detalle && (
                <p className="text-xs text-white/40 mt-0.5 truncate">
                  {Object.entries(r.detalle)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")}
                </p>
              )}
              {r.ip && <p className="text-[10px] text-white/25 mt-0.5">{r.ip}</p>}
            </div>
            <span className="text-[10px] text-white/30 shrink-0">{new Date(r.created_at).toLocaleString("es-MX")}</span>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-5">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(Math.max(0, page - 3), page + 2)
            .map((p) => (
              <button
                key={p}
                onClick={() => updateParams({ page: p === 1 ? null : String(p) })}
                className="w-8 h-8 rounded-full text-xs font-semibold"
                style={{
                  background: p === page ? "var(--shell-accent)" : "rgba(255,255,255,0.05)",
                  color: p === page ? "#fff" : "rgba(255,255,255,0.5)",
                }}
              >
                {p}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
