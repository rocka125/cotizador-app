// app/nueva-cotizacion/page.tsx (nuevo archivo)
"use client";

import CotizacionForm from "@/app/cotizaciones/page";

export default function NuevaCotizacionPage() {
  return (
    <div className="min-h-screen bg-gray-300">
      <CotizacionForm />
    </div>
  );
}