"use client";

import { useState } from "react";
import { IconMessage, IconX, IconSend } from "@tabler/icons-react";

// Admin -> vendedor: a standalone note about a specific quote, independent
// of approving/rejecting or editing it. Shared between the quote editor's
// toolbar and the dossier grid — same endpoint, same shape as EmailModal.
export function MessageVendorModal({
  quoteId,
  recipientLabel,
  onClose,
}: {
  quoteId: string;
  recipientLabel?: string;
  onClose: () => void;
}) {
  const [mensaje, setMensaje] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "No se pudo enviar el mensaje");
        return;
      }
      setSent(true);
    } catch {
      setError("Error de conexión al enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm print:hidden p-4">
      <div className="overlay-in bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {sent ? (
          <div className="text-center py-10 px-6">
            <div className="pop-in mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold text-lg mb-1">Mensaje enviado</p>
            <p className="text-sm text-gray-500 mb-6">
              {recipientLabel ? (
                <>
                  Le llegará a <span className="font-medium text-gray-700">{recipientLabel}</span> en sus notificaciones.
                </>
              ) : (
                "Le llegará al vendedor en sus notificaciones."
              )}
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg bg-[#D95A00] hover:bg-[#b84d00] text-white text-sm font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend}>
            <div className="flex items-center justify-between px-6 py-4" style={{ background: "linear-gradient(135deg, #D95A00, #b84d00)" }}>
              <div className="flex items-center gap-2.5 text-white">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                  <IconMessage size={16} />
                </div>
                <div>
                  <p className="font-semibold text-sm leading-tight">Enviar mensaje</p>
                  <p className="text-[11px] text-white/70 leading-tight">
                    {recipientLabel ? `Para ${recipientLabel}` : "Para el vendedor dueño de esta cotización"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                title="Cerrar"
                className="text-white/70 hover:text-white transition-colors p-1 -mr-1"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mensaje</label>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  required
                  rows={4}
                  autoFocus
                  placeholder="Ej. Ajusta el descuento antes de enviarla al cliente…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#D95A00]/25 focus:border-[#D95A00] transition-colors"
                />
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            </div>

            <div className="flex gap-2 px-6 pb-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sending || !mensaje.trim()}
                className="flex-1 py-2.5 rounded-lg bg-[#D95A00] hover:bg-[#b84d00] disabled:opacity-50 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                {sending ? (
                  "Enviando…"
                ) : (
                  <>
                    <IconSend size={14} /> Enviar
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
