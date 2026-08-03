import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { payloadToDbColumns, type QuoteSavePayload } from "@/lib/quotes/serialize";
import { logAudit, logFollowup, notifyAdmins } from "@/lib/quotes/logging";

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const payload = (await request.json()) as QuoteSavePayload;

  if (!payload.atencion?.trim() || !payload.clienteEmpresa?.trim()) {
    return NextResponse.json({ error: "Atención y Empresa son obligatorios" }, { status: 400 });
  }
  const hasItem = payload.items.some((it) => it.sku.trim() || it.descripcion.trim());
  if (!hasItem) {
    return NextResponse.json({ error: "Agrega al menos un producto" }, { status: 400 });
  }

  const supabase = await createClient();

  const anio = new Date().getFullYear();
  const { data: numero, error: numError } = await supabase.rpc("next_quote_number", { p_anio: anio });
  if (numError || !numero) {
    return NextResponse.json({ error: numError?.message ?? "No se pudo generar el número de cotización" }, { status: 500 });
  }

  const columns = payloadToDbColumns(payload);

  // Admins approve their own work by creating it -- only vendedor-created
  // quotes go through the pendiente review step.
  const estadoInicial = profile.role === "admin" ? "aprobada" : "pendiente";

  const { data: inserted, error } = await supabase
    .from("quotes")
    .insert({
      numero_cotizacion: numero,
      usuario_id: profile.id,
      estado: estadoInicial, // regardless of payload
      ...columns,
    })
    .select("id, numero_cotizacion")
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: error?.message ?? "Error al guardar" }, { status: 500 });
  }

  await logAudit(supabase, profile, {
    accion: "crear",
    quoteId: inserted.id,
    numeroCotizacion: inserted.numero_cotizacion,
    detalle: { cliente: payload.clienteEmpresa, total: columns.total, estado: estadoInicial },
  });
  await logFollowup(supabase, profile, {
    quoteId: inserted.id,
    descripcion: `Cotización ${inserted.numero_cotizacion} creada para el cliente «${payload.clienteEmpresa}».`,
  });
  if (profile.role !== "admin") {
    await notifyAdmins(supabase, profile, {
      quoteId: inserted.id,
      mensaje: `${profile.nombre ?? profile.email} creó la cotización ${inserted.numero_cotizacion} (Cliente: ${payload.clienteEmpresa}, Total: $${Number(columns.total).toLocaleString()})`,
      tipo: "creacion",
    });
  }

  return NextResponse.json({ id: inserted.id, numero_cotizacion: inserted.numero_cotizacion });
}
