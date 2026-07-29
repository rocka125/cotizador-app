// Shared quote types — extracted from the CotizacionForm editor so the
// editor, the save API, the read-only view, and the PDF renderer all agree
// on one shape instead of drifting copies.

export interface PriceItem {
  sheet: string;
  sku: string;
  desc: string;
  price: number;
}

export interface LineItem {
  id: number;
  cant: string;
  sku: string;
  unidad: string;
  descripcion: string;
  precioUnitario: string;
  descuento: string;
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

export type EstadoCotizacion = "pendiente" | "aprobada" | "rechazada";
