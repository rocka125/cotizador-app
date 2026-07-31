// Pure money-totals calculation — extracted verbatim from CotizacionForm.
// Called from three places (by design, per the port plan): the live editor
// preview (client), the save API's authoritative recompute (server — the
// client-sent totals are always discarded and replaced with this), and the
// PDF renderer. Keeping it in one place means screen, saved record, and PDF
// can never disagree.

import type { LineItem } from "./types";

export const parseMoneyInput = (v: string) => parseFloat(v.replace(/[^0-9.]/g, "")) || 0;

export const formatMXN = (n: number) =>
  n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export interface LineItemRow extends LineItem {
  extendido: number;
  descuentoMonto: number;
  subtotal: number;
}

export interface QuoteTotals {
  rows: LineItemRow[];
  subtotalGlobal: number;
  ivaPct: number;
  iva: number;
  total: number;
}

export function computeTotals(
  items: LineItem[],
  ivaActivo: boolean,
  ivaPercent: string
): QuoteTotals {
  const rows = items.map((item) => {
    const cant = parseMoneyInput(item.cant);
    const precio = parseMoneyInput(item.precioUnitario);
    // "descuento" is a discount PERCENTAGE (0-100), matching the original
    // PHP editor's "DESC. %" column -- not a flat peso amount. The peso
    // amount it works out to gets its own field (descuentoMonto) so the UI
    // can show it as the "-$X" line under P. Extendido, same as the PHP app.
    const descuentoPct = Math.max(0, Math.min(100, parseMoneyInput(item.descuento)));
    const extendido = cant * precio;
    const descuentoMonto = extendido * (descuentoPct / 100);
    const subtotal = extendido - descuentoMonto;
    return { ...item, extendido, descuentoMonto, subtotal };
  });

  const subtotalGlobal = rows.reduce((s, r) => s + r.subtotal, 0);
  const ivaPct = ivaActivo ? Math.max(0, parseFloat(ivaPercent) || 0) : 0;
  const iva = subtotalGlobal * (ivaPct / 100);
  const total = subtotalGlobal + iva;

  return { rows, subtotalGlobal, ivaPct, iva, total };
}
