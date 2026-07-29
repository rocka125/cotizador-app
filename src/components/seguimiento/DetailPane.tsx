"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconPhone, IconBrandWhatsapp, IconNote, IconMail, IconEye, IconTrash } from "@tabler/icons-react";
import { logContact, deleteContact, toggleOcultar } from "@/app/(app)/seguimiento/actions";
import type { FollowupRow, SeguimientoBoardItem } from "@/lib/quotes/data";

const TIPO_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  llamada: IconPhone,
  whatsapp: IconBrandWhatsapp,
  nota: IconNote,
  email: IconMail,
  apertura_email: IconEye,
};

interface ProfileLite {
  id: string;
  nombre: string | null;
  email: string;
}

export function DetailPane({
  quote,
  followups,
  profilesById,
}: {
  quote: SeguimientoBoardItem;
  followups: FollowupRow[];
  profilesById: Record<string, ProfileLite>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<"llamada" | "email" | "visita" | "whatsapp" | "nota">("nota");
  const [error, setError] = useState<string | null>(null);

  function submitLog(t: typeof tipo, desc: string) {
    setError(null);
    startTransition(async () => {
      try {
        await logContact({ quoteId: quote.id, tipo: t, descripcion: desc });
        setDescripcion("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al registrar contacto");
      }
    });
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descripcion.trim()) return;
    submitLog(tipo, descripcion.trim());
  }

  function handleToggleOcultar() {
    if (!quote.seguimiento_oculto) {
      if (!window.confirm(`¿Eliminar ${quote.numero_cotizacion} del tablero de seguimiento?\n\nLa cotización seguirá disponible en Lista de Cotizaciones, solo desaparece de este tablero.`)) {
        return;
      }
    }
    startTransition(async () => {
      await toggleOcultar(quote.id, !quote.seguimiento_oculto);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col h-full p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-mono text-white/40">{quote.numero_cotizacion}</p>
          <h2 className="text-lg font-serif italic text-white">{quote.cliente_empresa || "—"}</h2>
        </div>
        <div className="flex gap-2">
          <Link href={`/cotizaciones/${quote.id}/ver`} className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white">
            Ver cotización
          </Link>
          <button
            onClick={handleToggleOcultar}
            disabled={pending}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70"
            title={quote.seguimiento_oculto ? "Mostrar en seguimiento" : "Eliminar de seguimiento"}
          >
            {quote.seguimiento_oculto ? <IconEye size={14} /> : <IconTrash size={14} />}
          </button>
        </div>
      </div>

      {/* Quick log buttons */}
      <div className="flex gap-2 mb-4">
        <button
          disabled={pending}
          onClick={() => submitLog("llamada", "Llamada sin respuesta")}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70"
        >
          <IconPhone size={14} /> Sin respuesta
        </button>
        <button
          disabled={pending}
          onClick={() => submitLog("whatsapp", "WhatsApp pendiente de respuesta")}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70"
        >
          <IconBrandWhatsapp size={14} /> WA pendiente
        </button>
      </div>

      {/* Manual entry */}
      <form onSubmit={handleManualSubmit} className="mb-5 space-y-2">
        <div className="flex gap-2">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
            className="bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white"
          >
            <option value="nota">Nota</option>
            <option value="llamada">Llamada</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="visita">Visita</option>
            <option value="email">Email</option>
          </select>
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe el contacto…"
            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
          />
          <button
            type="submit"
            disabled={pending || !descripcion.trim()}
            className="px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-40"
            style={{ background: "var(--shell-accent)" }}
          >
            Registrar
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {followups.length === 0 && <p className="text-white/30 text-sm text-center py-8">Sin historial de contacto.</p>}
        {followups.map((f) => {
          const Icon = TIPO_ICON[f.tipo] ?? IconNote;
          const author = profilesById[f.usuario_id];
          return (
            <div key={f.id} className="flex gap-3 group">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 text-white/60">
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/80">{f.descripcion}</p>
                <p className="text-[10px] text-white/30">
                  {author?.nombre || author?.email} · {new Date(f.fecha_contacto).toLocaleString("es-MX")}
                </p>
              </div>
              <button
                onClick={() => startTransition(async () => { await deleteContact(f.id); router.refresh(); })}
                className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-opacity shrink-0"
              >
                <IconTrash size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
