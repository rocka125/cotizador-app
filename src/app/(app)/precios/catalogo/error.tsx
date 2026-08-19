"use client";

import { useEffect } from "react";

export default function CatalogoError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-6">
      <div className="rounded-2xl border p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
        <p className="text-white font-semibold mb-1">No se pudo cargar el catálogo</p>
        <p className="text-white/50 text-sm mb-5">
          Ocurrió un problema al traer la lista de precios activa. Puede ser una falla de conexión o que no haya una versión activa cargada.
        </p>
        <button
          onClick={reset}
          className="text-sm px-4 py-2 rounded-full font-medium text-white transition-colors"
          style={{ background: "var(--shell-accent)" }}
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
