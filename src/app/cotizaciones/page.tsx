// Temporary passthrough: CotizacionForm was relocated to
// src/components/quotes/CotizacionForm.tsx (Phase 0 of the cotizador port).
// This route still serves the editor for now — Phase 1 repurposes
// /cotizaciones into the "lista de cotizaciones" dossier grid and moves the
// editor to /cotizaciones/nueva and /cotizaciones/[id].
"use client";

import CotizacionForm from "@/components/quotes/CotizacionForm";

export default function CotizacionesPage() {
  return <CotizacionForm />;
}
