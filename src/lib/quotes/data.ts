import { createClient } from "@/lib/supabase/server";
import type { QuoteRow } from "./serialize";
import type { EstadoCotizacion } from "./types";

const QUOTE_COLUMNS = `
  id, numero_cotizacion, usuario_id, fecha,
  cliente_atencion, cliente_puesto, cliente_empresa,
  empresa_nombre, empresa_rfc, empresa_direccion, empresa_web, empresa_email,
  empresa_tel_oficina, empresa_tel_movil,
  vigencia_dias, tiempo_entrega, condiciones_pago, vigencia_servicios, lugar_entrega,
  moneda_code, tipo_cambio,
  items, subtotal, aplica_iva, iva_porcentaje, iva, total,
  firma_nombre, firma_puesto, firma_tel, firma_img, sello_img,
  estado, seguimiento_oculto, email_token, email_opened_at, email_open_count,
  created_at, updated_at
`;

export async function getQuoteById(id: string): Promise<QuoteRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("quotes").select(QUOTE_COLUMNS).eq("id", id).single();
  if (error || !data) return null;
  return data as unknown as QuoteRow;
}

export interface ListQuotesParams {
  search?: string;
  estado?: EstadoCotizacion | "todas";
  page?: number;
  pageSize?: number;
}

export interface QuoteListItem {
  id: string;
  numero_cotizacion: string;
  usuario_id: string;
  cliente_empresa: string | null;
  cliente_atencion: string | null;
  total: string;
  moneda_code: string;
  estado: EstadoCotizacion;
  created_at: string;
}

export async function listQuotes({ search, estado, page = 1, pageSize = 15 }: ListQuotesParams) {
  const supabase = await createClient();
  let query = supabase
    .from("quotes")
    .select(
      "id, numero_cotizacion, usuario_id, cliente_empresa, cliente_atencion, total, moneda_code, estado, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (estado && estado !== "todas") query = query.eq("estado", estado);
  if (search) {
    query = query.or(
      `numero_cotizacion.ilike.%${search}%,cliente_empresa.ilike.%${search}%,cliente_atencion.ilike.%${search}%`
    );
  }

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);

  return { items: (data ?? []) as QuoteListItem[], total: count ?? 0, page, pageSize };
}

export interface DashboardStats {
  totalQuotes: number;
  totalAmountUsd: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  recentQuotes: QuoteListItem[];
  monthlyVolume: { month: string; count: number }[];
  proximasAVencer: { id: string; numero_cotizacion: string; cliente_empresa: string | null; fecha: string; diasRestantes: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("id, numero_cotizacion, usuario_id, cliente_empresa, cliente_atencion, total, moneda_code, estado, fecha, vigencia_dias, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  const rows = data ?? [];

  const totalAmountUsd = rows.reduce((sum, r) => sum + (r.moneda_code === "USD" ? Number(r.total) : 0), 0);

  const monthCounts = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
  }
  const monthlyVolume = [...monthCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({ month, count }));

  const today = new Date();
  const proximasAVencer = rows
    .filter((r) => r.estado === "pendiente" && r.vigencia_dias)
    .map((r) => {
      const fecha = new Date(r.fecha);
      const vence = new Date(fecha.getTime() + (r.vigencia_dias ?? 0) * 86400000);
      const diasRestantes = Math.ceil((vence.getTime() - today.getTime()) / 86400000);
      return { id: r.id, numero_cotizacion: r.numero_cotizacion, cliente_empresa: r.cliente_empresa, fecha: r.fecha, diasRestantes };
    })
    .filter((r) => r.diasRestantes >= 0 && r.diasRestantes <= 7)
    .sort((a, b) => a.diasRestantes - b.diasRestantes);

  return {
    totalQuotes: rows.length,
    totalAmountUsd,
    pendingCount: rows.filter((r) => r.estado === "pendiente").length,
    approvedCount: rows.filter((r) => r.estado === "aprobada").length,
    rejectedCount: rows.filter((r) => r.estado === "rechazada").length,
    recentQuotes: rows.slice(0, 8) as QuoteListItem[],
    monthlyVolume,
    proximasAVencer,
  };
}

export interface SeguimientoBoardItem {
  id: string;
  numero_cotizacion: string;
  cliente_empresa: string | null;
  usuario_id: string;
  estado: EstadoCotizacion;
  total: string;
  moneda_code: string;
  seguimiento_oculto: boolean;
  email_token: string | null;
  email_opened_at: string | null;
  created_at: string;
  lastContactAt: string | null;
}

export type SeguimientoFilter = "activas" | "enviadas" | "sin_correo" | "todas";

export async function listSeguimientoBoard(filtro: SeguimientoFilter = "activas"): Promise<SeguimientoBoardItem[]> {
  const supabase = await createClient();
  let query = supabase
    .from("quotes")
    .select(
      "id, numero_cotizacion, cliente_empresa, usuario_id, estado, total, moneda_code, seguimiento_oculto, email_token, email_opened_at, created_at"
    )
    .order("created_at", { ascending: false });

  // "activas" (default) hides quotes the user explicitly hid from this board
  // (seguimiento_oculto) -- everything else ignores that flag on purpose,
  // since "todas"/"enviadas"/"sin_correo" are precisely the escape hatches
  // for finding a quote you (or historical data) hid.
  if (filtro === "activas") query = query.eq("seguimiento_oculto", false);
  else if (filtro === "enviadas") query = query.not("email_token", "is", null);
  else if (filtro === "sin_correo") query = query.is("email_token", null);

  const { data: quotes } = await query;
  const quotesArr = quotes ?? [];
  const ids = quotesArr.map((q) => q.id);

  const { data: followups } = await supabase
    .from("quote_followups")
    .select("quote_id, fecha_contacto")
    .in("quote_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"])
    .order("fecha_contacto", { ascending: false });

  const lastContact = new Map<string, string>();
  for (const f of followups ?? []) {
    if (!lastContact.has(f.quote_id)) lastContact.set(f.quote_id, f.fecha_contacto);
  }

  return quotesArr.map((q) => ({ ...q, lastContactAt: lastContact.get(q.id) ?? null }));
}

export interface FollowupRow {
  id: string;
  quote_id: string;
  usuario_id: string;
  tipo: string;
  descripcion: string | null;
  fecha_contacto: string;
  proximo_contacto: string | null;
}

export async function getFollowupsForQuote(quoteId: string): Promise<FollowupRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quote_followups")
    .select("id, quote_id, usuario_id, tipo, descripcion, fecha_contacto, proximo_contacto")
    .eq("quote_id", quoteId)
    .order("fecha_contacto", { ascending: false });
  return data ?? [];
}

export interface AuditLogRow {
  id: string;
  tipo: "sesion" | "cotizacion";
  usuario_id: string | null;
  usuario_nombre: string | null;
  accion: string;
  quote_id: string | null;
  numero_cotizacion: string | null;
  detalle: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

export async function listAuditLog({
  tipo,
  page = 1,
  pageSize = 30,
}: {
  tipo?: "sesion" | "cotizacion" | "todo";
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createClient();
  let query = supabase.from("audit_log").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (tipo && tipo !== "todo") query = query.eq("tipo", tipo);

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);
  return { items: (data ?? []) as AuditLogRow[], total: count ?? 0, page, pageSize };
}

export async function getAuditStats() {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data } = await supabase.from("audit_log").select("tipo, accion, created_at");
  const rows = data ?? [];
  const isToday = (d: string) => new Date(d) >= today;

  return {
    loginsHoy: rows.filter((r) => r.tipo === "sesion" && r.accion === "login" && isToday(r.created_at)).length,
    creadasHoy: rows.filter((r) => r.accion === "crear" && isToday(r.created_at)).length,
    editadasHoy: rows.filter((r) => r.accion === "editar" && isToday(r.created_at)).length,
    eliminadasTotal: rows.filter((r) => r.accion === "eliminar").length,
  };
}
