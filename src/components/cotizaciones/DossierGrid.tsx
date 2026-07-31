"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import { IconEye, IconEdit, IconCheck, IconX, IconTrash, IconSearch, IconMail } from "@tabler/icons-react";
import type { QuoteListItem } from "@/lib/quotes/data";
import { EmailModal } from "@/components/quotes/EmailModal";

interface ProfileLite {
  id: string;
  nombre: string | null;
  email: string;
}

const ESTADO_LABEL: Record<string, { label: string; color: string }> = {
  pendiente: { label: "EN REVISIÓN", color: "#f59e0b" },
  aprobada: { label: "APROBADO", color: "#4ade80" },
  rechazada: { label: "RECHAZADO", color: "#ef4444" },
};

function formatMoney(total: string, moneda: string) {
  const n = Number(total);
  return `${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${moneda}`;
}

export function DossierGrid({
  quotes,
  profilesById,
  total,
  page,
  pageSize,
  isAdmin,
  currentUserId,
}: {
  quotes: QuoteListItem[];
  profilesById: Record<string, ProfileLite>;
  total: number;
  page: number;
  pageSize: number;
  isAdmin: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [emailModalId, setEmailModalId] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  function updateParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParams({ q: search || null, page: null });
  }

  const currentEstado = searchParams.get("estado") ?? "todas";

  async function handleEstadoChange(id: string, estado: "aprobada" | "rechazada") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/quotes/${id}/estado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error ?? "Error al cambiar el estado");
      } else {
        router.refresh();
      }
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(body.error ?? "Error al eliminar");
        setBusyId(null);
        setConfirmDelete(null);
        return;
      }
      // Play the exit animation before the data actually disappears --
      // router.refresh() re-renders with this card gone from the list, so
      // triggering it immediately would just vanish the card. Delaying it
      // past card-out's duration lets the shrink+fade play out first.
      setConfirmDelete(null);
      setRemovingIds((prev) => new Set(prev).add(id));
      setTimeout(() => router.refresh(), 320);
    } catch {
      setBusyId(null);
      setConfirmDelete(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6 space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px] max-w-md">
          <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, empresa o atención…"
            className="w-full rounded-full bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--shell-accent)]"
          />
        </form>

        <div className="flex gap-1 rounded-full bg-white/5 border border-white/10 p-1">
          {["todas", "pendiente", "aprobada", "rechazada"].map((e) => (
            <button
              key={e}
              onClick={() => updateParams({ estado: e === "todas" ? null : e, page: null })}
              className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors"
              style={{
                background: currentEstado === e ? "var(--shell-accent)" : "transparent",
                color: currentEstado === e ? "#fff" : "rgba(255,255,255,0.6)",
              }}
            >
              {e}
            </button>
          ))}
        </div>

        <Link
          href="/cotizaciones/nueva"
          className="ml-auto px-4 py-2 rounded-full text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105"
          style={{ background: "var(--shell-accent)" }}
        >
          + Nueva Cotización
        </Link>
      </div>

      {/* Grid */}
      {quotes.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          No hay cotizaciones{search ? ` para "${search}"` : ""}.
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 transition-opacity ${pending ? "opacity-50" : ""}`}>
          {quotes.map((q, idx) => {
            const estadoInfo = ESTADO_LABEL[q.estado] ?? ESTADO_LABEL.pendiente;
            const owner = profilesById[q.usuario_id];
            const isOwner = q.usuario_id === currentUserId;
            const canDecide = isAdmin && q.estado === "pendiente";
            const canDelete = isAdmin || (isOwner && q.estado === "pendiente");
            const busy = busyId === q.id;

            const removing = removingIds.has(q.id);

            return (
              <div
                key={q.id}
                className={`${removing ? "card-out" : "row-in"} relative overflow-hidden rounded-2xl border p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/30`}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.08)",
                  // Capped so a full page of results doesn't take forever to
                  // finish revealing -- past the 12th card they all arrive together.
                  animationDelay: removing ? undefined : `${Math.min(idx, 11) * 30}ms`,
                }}
              >
                {/* Ribbon -- transitions color instead of snapping when
                    Aprobar/Rechazar changes q.estado on the same mounted card. */}
                <div
                  className="absolute top-0 right-0 px-3 py-1 text-[10px] font-bold tracking-wider text-white rounded-bl-lg transition-colors duration-500"
                  style={{ background: estadoInfo.color }}
                >
                  {estadoInfo.label}
                </div>

                <div className="font-mono text-xs text-white/40 mb-1">{q.numero_cotizacion}</div>
                <div className="text-lg font-serif italic text-white mb-1 truncate">{q.cliente_empresa || "—"}</div>
                <div className="text-sm text-white/60 mb-3 truncate">Atención: {q.cliente_atencion || "—"}</div>
                <div className="text-2xl font-bold text-white mb-1">{formatMoney(q.total, q.moneda_code)}</div>
                <div className="text-xs text-white/30 mb-4">
                  {owner ? owner.nombre || owner.email : "—"} · {new Date(q.created_at).toLocaleDateString("es-MX")}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
                  <Link href={`/cotizaciones/${q.id}/ver`} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70" title="Ver">
                    <IconEye size={16} />
                  </Link>
                  <Link href={`/cotizaciones/${q.id}`} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70" title="Editar">
                    <IconEdit size={16} />
                  </Link>
                  <button
                    onClick={() => setEmailModalId(q.id)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70"
                    title="Enviar por correo"
                  >
                    <IconMail size={16} />
                  </button>
                  {canDecide && (
                    <>
                      <button
                        disabled={busy}
                        onClick={() => handleEstadoChange(q.id, "aprobada")}
                        className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 disabled:opacity-40"
                        title="Aprobar"
                      >
                        <IconCheck size={16} />
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => handleEstadoChange(q.id, "rechazada")}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-40"
                        title="Rechazar"
                      >
                        <IconX size={16} />
                      </button>
                    </>
                  )}
                  {canDelete && (
                    <button
                      disabled={busy}
                      onClick={() => setConfirmDelete(q.id)}
                      className="ml-auto p-2 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 disabled:opacity-40"
                      title="Eliminar"
                    >
                      <IconTrash size={16} />
                    </button>
                  )}
                </div>

                {confirmDelete === q.id && (
                  <div className="overlay-in absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/90 backdrop-blur-sm rounded-2xl p-4 text-center">
                    <p className="text-sm text-white">¿Eliminar {q.numero_cotizacion}? Esta acción no se puede deshacer.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="px-4 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold"
                      >
                        Eliminar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => updateParams({ page: p === 1 ? null : String(p) })}
              className="w-8 h-8 rounded-full text-xs font-semibold transition-colors"
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

      {emailModalId && <EmailModal quoteId={emailModalId} onClose={() => setEmailModalId(null)} />}
    </div>
  );
}
