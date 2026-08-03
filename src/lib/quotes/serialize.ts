// Converts between the editor's in-memory form shape (LineItem, EmpresaInfo,
// etc. — kept as-is from the original CotizacionForm to avoid UI churn) and
// the `quotes` table's DB shape (snake_case columns, canonical items jsonb).
//
// Canonical items jsonb shape (decided during the legacy-data import, see
// supabase/migrations/0013_import_legacy_data.sql): each item is
// {sku, descripcion, unidad, cantidad, precio_unitario, descuento, extendido, subtotal}.

import type { LineItem, Condiciones, EmpresaInfo, FirmaInfo, MonedaCode, EstadoCotizacion } from "./types";
import { computeTotals } from "./totals";

export interface DbLineItem {
  sku: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  extendido: number;
  subtotal: number;
}

export function itemsToDb(items: LineItem[], ivaActivo: boolean, ivaPercent: string): DbLineItem[] {
  const { rows } = computeTotals(items, ivaActivo, ivaPercent);
  return rows
    .filter((r) => r.sku.trim() || r.descripcion.trim())
    .map((r) => ({
      sku: r.sku,
      descripcion: r.descripcion,
      unidad: r.unidad,
      cantidad: Number(r.cant) || 0,
      precio_unitario: Number(r.precioUnitario) || 0,
      descuento: Number(r.descuento) || 0,
      extendido: r.extendido,
      subtotal: r.subtotal,
    }));
}

export function itemsFromDb(items: DbLineItem[] | null | undefined): LineItem[] {
  if (!items || items.length === 0) {
    return [{ id: 1, cant: "", sku: "", unidad: "PZA", descripcion: "", precioUnitario: "", descuento: "" }];
  }
  return items.map((it, idx) => ({
    id: idx + 1,
    cant: String(it.cantidad ?? ""),
    sku: it.sku ?? "",
    unidad: it.unidad ?? "PZA",
    descripcion: it.descripcion ?? "",
    precioUnitario: String(it.precio_unitario ?? ""),
    descuento: String(it.descuento ?? ""),
  }));
}

export interface QuoteFormState {
  atencion: string;
  clientePuesto: string;
  clienteEmpresa: string;
  clienteTelefono: string;
  empresa: EmpresaInfo;
  vigenciaDias: string;
  monedaCode: MonedaCode;
  tipoCambio: string;
  condiciones: Condiciones;
  firma: FirmaInfo;
  firmaImg: string | null;
  selloImg: string | null;
  items: LineItem[];
  ivaActivo: boolean;
  ivaPercent: string;
}

// What the client POSTs/PATCHes to the API — same as the form state, plus
// an optional admin-only estado override and message.
export interface QuoteSavePayload extends QuoteFormState {
  estado?: EstadoCotizacion;
  mensajeAdmin?: string;
}

// Row shape as read back from Supabase (subset of columns the app actually
// uses client-side; DB has more legacy/reference-only columns).
export interface QuoteRow {
  id: string;
  numero_cotizacion: string;
  usuario_id: string;
  fecha: string;
  cliente_atencion: string | null;
  cliente_puesto: string | null;
  cliente_empresa: string | null;
  cliente_telefono: string | null;
  empresa_nombre: string | null;
  empresa_rfc: string | null;
  empresa_direccion: string | null;
  empresa_web: string | null;
  empresa_email: string | null;
  empresa_tel_oficina: string | null;
  empresa_tel_movil: string | null;
  vigencia_dias: number | null;
  tiempo_entrega: string | null;
  condiciones_pago: string | null;
  vigencia_servicios: string | null;
  lugar_entrega: string | null;
  moneda_code: MonedaCode;
  tipo_cambio: string | null;
  items: DbLineItem[];
  subtotal: string;
  aplica_iva: boolean;
  iva_porcentaje: string;
  iva: string;
  total: string;
  firma_nombre: string | null;
  firma_puesto: string | null;
  firma_tel: string | null;
  firma_img: string | null;
  sello_img: string | null;
  estado: EstadoCotizacion;
  seguimiento_oculto: boolean;
  email_token: string | null;
  email_opened_at: string | null;
  email_open_count: number;
  created_at: string;
  updated_at: string;
}

export function quoteRowToFormState(row: QuoteRow): QuoteFormState {
  return {
    atencion: row.cliente_atencion ?? "",
    clientePuesto: row.cliente_puesto ?? "",
    clienteEmpresa: row.cliente_empresa ?? "",
    clienteTelefono: row.cliente_telefono ?? "",
    empresa: {
      nombre: row.empresa_nombre ?? "Fortress8 Cibersecurity Services SA de CV",
      rfc: row.empresa_rfc ?? "FCS180507LBA",
      direccion: row.empresa_direccion ?? "Cerrada Montejo #190, El Cedro, Nacajuca, Tabasco. Cp. 86220",
      web: row.empresa_web ?? "www.fortress8.com",
      email: row.empresa_email ?? "contacto@fortress8.com",
      telOficina: row.empresa_tel_oficina ?? "9933179494",
      telMovil: row.empresa_tel_movil ?? "9934581129",
    },
    vigenciaDias: row.vigencia_dias != null ? String(row.vigencia_dias) : "30",
    monedaCode: row.moneda_code ?? "USD",
    tipoCambio: row.tipo_cambio ?? "1.0000",
    condiciones: {
      tiempoEntrega: row.tiempo_entrega ?? "",
      vigenciaServicios: row.vigencia_servicios ?? "",
      condicionesPago: row.condiciones_pago ?? "",
      lugarEntrega: row.lugar_entrega ?? "",
    },
    firma: {
      nombre: row.firma_nombre ?? "Manuel Ble Vazquez",
      puesto: row.firma_puesto ?? "Gerencia Comercial",
      tel: row.firma_tel ?? "9932619380",
    },
    firmaImg: row.firma_img,
    selloImg: row.sello_img,
    items: itemsFromDb(row.items),
    ivaActivo: !!row.aplica_iva,
    ivaPercent: row.iva_porcentaje ?? "16",
  };
}

// Builds the exact column set the save API inserts/updates, with totals
// ALWAYS recomputed here (server-side, authoritative) rather than trusting
// whatever numbers the client happened to send.
export function payloadToDbColumns(payload: QuoteSavePayload) {
  const { subtotalGlobal, ivaPct, iva, total } = computeTotals(payload.items, payload.ivaActivo, payload.ivaPercent);
  const dbItems = itemsToDb(payload.items, payload.ivaActivo, payload.ivaPercent);

  return {
    cliente_atencion: payload.atencion,
    cliente_puesto: payload.clientePuesto,
    cliente_empresa: payload.clienteEmpresa,
    cliente_telefono: payload.clienteTelefono || null,
    cliente_nombre: payload.atencion,
    empresa_nombre: payload.empresa.nombre,
    empresa_rfc: payload.empresa.rfc,
    empresa_direccion: payload.empresa.direccion,
    empresa_web: payload.empresa.web,
    empresa_email: payload.empresa.email,
    empresa_tel_oficina: payload.empresa.telOficina,
    empresa_tel_movil: payload.empresa.telMovil,
    vigencia_dias: payload.vigenciaDias ? Number(payload.vigenciaDias) : null,
    tiempo_entrega: payload.condiciones.tiempoEntrega,
    condiciones_pago: payload.condiciones.condicionesPago,
    vigencia_servicios: payload.condiciones.vigenciaServicios,
    lugar_entrega: payload.condiciones.lugarEntrega,
    moneda_code: payload.monedaCode,
    tipo_cambio: payload.tipoCambio ? Number(payload.tipoCambio) : 1,
    items: dbItems,
    subtotal: subtotalGlobal,
    aplica_iva: payload.ivaActivo,
    iva_porcentaje: ivaPct,
    iva,
    total,
    firma_nombre: payload.firma.nombre,
    firma_puesto: payload.firma.puesto,
    firma_tel: payload.firma.tel,
    firma_img: payload.firmaImg,
    sello_img: payload.selloImg,
  };
}
