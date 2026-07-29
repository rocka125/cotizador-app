"use client";

import { useState } from "react";

// Shared between the quote editor/viewer toolbar and the Lista de
// Cotizaciones dossier grid — same "✉ Correo" action, same endpoint.
export function EmailModal({ quoteId, onClose }: { quoteId: string; onClose: () => void }) {
  const [to, setTo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, mensaje }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "No se pudo enviar el correo");
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
        {sent ? (
          <div className="text-center py-4">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold mb-1">Correo enviado</p>
            <p className="text-sm text-gray-500 mb-5">Se envió la cotización con el PDF adjunto.</p>
            <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-[#D95A00] hover:bg-[#b84d00] text-white text-sm font-semibold">
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Enviar cotización por correo</h3>
            <label className="block text-xs text-gray-600 mb-1">Correo del destinatario</label>
            <input
              type="email"
              required
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="cliente@empresa.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 mb-3"
            />
            <label className="block text-xs text-gray-600 mb-1">Mensaje (opcional)</label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 mb-3 resize-none"
            />
            {error && <p className="text-xs text-red-600 mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sending}
                className="flex-1 py-2.5 rounded-lg bg-[#D95A00] hover:bg-[#b84d00] disabled:opacity-50 text-white text-sm font-semibold"
              >
                {sending ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
