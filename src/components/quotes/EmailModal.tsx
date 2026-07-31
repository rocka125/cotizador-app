"use client";

import { useState } from "react";
import { IconMail, IconX, IconSend } from "@tabler/icons-react";

// Shared between the quote editor/viewer toolbar and the Lista de
// Cotizaciones dossier grid — same "✉ Correo" action, same endpoint.
export function EmailModal({ quoteId, onClose }: { quoteId: string; onClose: () => void }) {
  const [to, setTo] = useState("");
  const [ccList, setCcList] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function addCc(raw: string) {
    const email = raw.trim().replace(/,$/, "");
    if (!email) return;
    if (!email.includes("@")) {
      setError(`Correo de copia inválido: ${email}`);
      return;
    }
    setError(null);
    setCcList((prev) => (prev.includes(email) ? prev : [...prev, email]));
    setCcInput("");
  }

  function removeCc(email: string) {
    setCcList((prev) => prev.filter((e) => e !== email));
  }

  function handleCcKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCc(ccInput);
    } else if (e.key === "Backspace" && !ccInput && ccList.length > 0) {
      setCcList((prev) => prev.slice(0, -1));
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, cc: ccList, mensaje }),
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm print:hidden p-4">
      <div className="overlay-in bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {sent ? (
          <div className="text-center py-10 px-6">
            <div className="pop-in mx-auto mb-4 w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#16a34a" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold text-lg mb-1">Correo enviado</p>
            <p className="text-sm text-gray-500 mb-6">
              Se envió a <span className="font-medium text-gray-700">{to}</span>
              {ccList.length > 0 && (
                <>
                  {" "}
                  con copia a {ccList.length} correo{ccList.length > 1 ? "s" : ""} más
                </>
              )}
              , con el PDF adjunto.
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
                  <IconMail size={16} />
                </div>
                <div>
                  <p className="font-semibold text-sm leading-tight">Enviar cotización</p>
                  <p className="text-[11px] text-white/70 leading-tight">Se adjunta el PDF automáticamente</p>
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
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Destinatario</label>
                <input
                  type="email"
                  required
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="cliente@empresa.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#D95A00]/25 focus:border-[#D95A00] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Con copia (CC) <span className="font-normal text-gray-400">opcional</span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5 border border-gray-300 rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-[#D95A00]/25 focus-within:border-[#D95A00] transition-colors">
                  {ccList.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 bg-orange-50 text-[#b84d00] text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => removeCc(email)}
                        title="Quitar"
                        className="hover:bg-orange-200/60 rounded-full p-0.5 transition-colors"
                      >
                        <IconX size={10} />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={handleCcKeyDown}
                    onBlur={() => addCc(ccInput)}
                    placeholder={ccList.length ? "otro correo…" : "otro@correo.com — Enter para agregar"}
                    className="flex-1 min-w-[140px] text-sm text-gray-900 outline-none py-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Mensaje <span className="font-normal text-gray-400">opcional</span>
                </label>
                <textarea
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  rows={3}
                  placeholder="Un mensaje breve para el cliente…"
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
                disabled={sending}
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
