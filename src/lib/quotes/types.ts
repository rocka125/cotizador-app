// Shared quote types — extracted from the CotizacionForm editor so the
// editor, the save API, the read-only view, and the PDF renderer all agree
// on one shape instead of drifting copies.

export interface PriceItem {
  sheet: string;
  sku: string;
  desc: string;
  unitName: string;
  // The price used when adding this item to a quote -- precio if the SKU
  // has a flat/one-time price, else whichever contract-term price comes
  // first (1yr preferred). See CotizacionForm's usePriceList().
  price: number;
  // Full term breakdown, kept alongside `price` for anything (like a future
  // "elegir plazo" picker) that wants to show/choose among them -- not
  // consumed by the picker's "+" button today, which just uses `price`.
  precio1yr: number | null;
  precio2yr: number | null;
  precio3yr: number | null;
  precio4yr: number | null;
  precio5yr: number | null;
}

export interface LineItemTerm {
  anios: 1 | 2 | 3 | 4 | 5;
  precio: number;
}

export interface LineItem {
  id: number;
  cant: string;
  sku: string;
  unidad: string;
  descripcion: string;
  precioUnitario: string;
  descuento: string;
  // Present only for a line added from a price-list SKU that has 2+
  // contract-term prices (e.g. a FortiCare bundle: 1/3/5yr) -- lets the row
  // show a "Plazo" selector that swaps precioUnitario between terms.
  // Absent for hardware/flat-price items and for hand-typed rows.
  terminos?: LineItemTerm[];
  // Which term precioUnitario currently reflects; null once the user
  // hand-edits precioUnitario directly (no longer tied to a specific term).
  plazoAnios?: LineItemTerm["anios"] | null;
}

export interface Condiciones {
  vigenciaServicios: string;
  tiempoEntrega: string;
  condicionesPago: string;
  lugarEntrega: string;
}

export interface EmpresaInfo {
  nombre: string;
  rfc: string;
  direccion: string;
  web: string;
  email: string;
  telOficina: string;
  telMovil: string;
}

export interface FirmaInfo {
  nombre: string;
  puesto: string;
  tel: string;
}

export type MonedaCode = "USD" | "MXN" | "EUR";

export const MONEDA_LABELS: Record<MonedaCode, string> = {
  USD: "USD (Dólares americanos)",
  MXN: "MXN (Pesos mexicanos)",
  EUR: "EUR (Euros)",
};

export type EstadoCotizacion = "pendiente" | "aprobada" | "rechazada";
