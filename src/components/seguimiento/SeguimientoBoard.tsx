"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { IconTrash } from "@tabler/icons-react";
import { toggleOcultar } from "@/app/(app)/seguimiento/actions";
import type { SeguimientoBoardItem } from "@/lib/quotes/data";

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

interface ProfileLite {
  id: string;
  nombre: string | null;
  email: string;
}

export function SeguimientoBoard({
  items,
  profilesById,
  selectedId,
}: {
  items: SeguimientoBoardItem[];
  profilesById: Record<string, ProfileLite>;
  selectedId?: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent, id: string, numero: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`¿Eliminar ${numero} del tablero de seguimiento?\n\nLa cotización seguirá disponible en Lista de Cotizaciones, solo desaparece de este tablero.`)) {
      return;
    }
    startTransition(async () => {
      await toggleOcultar(id, true);
      router.refresh();
    });
  }

  const enviadas = items.filter((i) => i.email_token);
  const abiertas = items.filter((i) => i.email_opened_at);
  const urgentes = items.filter((i) => {
    const d = daysSince(i.lastContactAt ?? i.created_at);
    return d !== null && d >= 5;
  });
  const totalValor = items.reduce((s, i) => s + (i.moneda_code === "USD" ? Number(i.total) : 0), 0);

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-4 gap-2 p-4">
        <div className="rounded-xl bg-white/5 p-3 text-center">
          <p className="text-lg font-bold text-white">{enviadas.length}</p>
          <p className="text-[10px] text-white/40 uppercase">Enviadas</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3 text-center">
          <p className="text-lg font-bold text-green-400">{abiertas.length}</p>
          <p className="text-[10px] text-white/40 uppercase">Abiertas</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3 text-center">
          <p className="text-lg font-bold text-red-400">{urgentes.length}</p>
          <p className="text-[10px] text-white/40 uppercase">Urgentes</p>
        </div>
        <div className="rounded-xl bg-white/5 p-3 text-center">
          <p className="text-sm font-bold text-white">${totalValor.toLocaleString("es-MX", { maximumFractionDigits: 0 })}</p>
          <p className="text-[10px] text-white/40 uppercase">Valor USD</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {items.length === 0 && <p className="text-center text-white/30 text-sm py-10">Sin cotizaciones en seguimiento.</p>}
        {items.map((it) => {
          const d = daysSince(it.lastContactAt ?? it.created_at);
          const isUrgent = d !== null && d >= 5;
          const owner = profilesById[it.usuario_id];
          const params = new URLSearchParams(searchParams.toString());
          params.set("id", it.id);
          return (
            <Link
              key={it.id}
              href={`/seguimiento?${params.toString()}`}
              className="block rounded-xl p-3 transition-colors"
              style={{
                background: selectedId === it.id ? "rgba(245,123,2,0.12)" : "rgba(255,255,255,0.03)",
                border: selectedId === it.id ? "1px solid var(--shell-accent)" : "1px solid transparent",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-white/40">{it.numero_cotizacion}</span>
                <div className="flex items-center gap-1.5">
                  {isUrgent && <span className="text-[9px] font-bold uppercase text-red-400">Urgente</span>}
                  <button
                    onClick={(e) => handleDelete(e, it.id, it.numero_cotizacion)}
                    disabled={pending}
                    title="Eliminar de seguimiento (no afecta Lista de Cotizaciones)"
                    className="text-white/20 hover:text-red-400 transition-colors"
                  >
                    <IconTrash size={13} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-white truncate">{it.cliente_empresa || "—"}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-white/30">{owner?.nombre || owner?.email}</span>
                <span className="text-[10px] text-white/40">{d === null ? "sin contacto" : `hace ${d}d`}</span>
              </div>
              {it.email_opened_at && <span className="text-[10px] text-green-400">👁 Abierto</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
