import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { payloadToDbColumns, type QuoteSavePayload } from "@/lib/quotes/serialize";
import { logAudit, logFollowup, notifyAdmins, notifyUser } from "@/lib/quotes/logging";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("quotes")
    .select("id, usuario_id, estado, numero_cotizacion")
    .eq("id", id)
    .single();
  if (!existing) return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });

  const isOwner = existing.usuario_id === profile.id;
  const isAdmin = profile.role === "admin";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "No tienes permiso para editar esta cotización" }, { status: 403 });
  }
  if (!isAdmin && existing.estado !== "pendiente") {
    return NextResponse.json({ error: "No puedes editar una cotización ya aprobada o rechazada" }, { status: 403 });
  }

  const payload = (await request.json()) as QuoteSavePayload;
  if (!payload.atencion?.trim() || !payload.clienteEmpresa?.trim()) {
    return NextResponse.json({ error: "Atención y Empresa son obligatorios" }, { status: 400 });
  }

  const columns = payloadToDbColumns(payload);

  // Admin editing someone else's already-decided quote: the content is
  // changing after the fact, so the decision no longer applies -- force
  // back to pendiente and let the owner know (mirrors the PHP app's rule).
  const wasDecidedByOther = isAdmin && !isOwner && existing.estado !== "pendiente";
  const nextEstado = wasDecidedByOther ? "pendiente" : existing.estado;

  const { error } = await supabase
    .from("quotes")
    .update({ ...columns, estado: nextEstado })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit(supabase, profile, {
    accion: "editar",
    quoteId: id,
    numeroCotizacion: existing.numero_cotizacion,
    detalle: { cliente: payload.clienteEmpresa, total: columns.total, estado: nextEstado },
  });
  await logFollowup(supabase, profile, {
    quoteId: id,
    descripcion: wasDecidedByOther
      ? `Cotización ${existing.numero_cotizacion} editada por un administrador y regresada a pendiente.`
      : `Cotización ${existing.numero_cotizacion} editada.`,
  });

  if (!isAdmin) {
    await notifyAdmins(supabase, profile, {
      quoteId: id,
      mensaje: `${profile.nombre ?? profile.email} editó la cotización ${existing.numero_cotizacion} (Cliente: ${payload.clienteEmpresa}, Total: $${Number(columns.total).toLocaleString()})`,
    });
  } else if (!isOwner) {
    const mensaje = payload.mensajeAdmin?.trim()
      ? `Un administrador editó tu cotización ${existing.numero_cotizacion}: "${payload.mensajeAdmin.trim()}"`
      : `Un administrador editó tu cotización ${existing.numero_cotizacion}.`;
    await notifyUser(supabase, profile, { targetUserId: existing.usuario_id, quoteId: id, mensaje });
  }

  return NextResponse.json({ id, estado: nextEstado });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const supabase = await createClient();

  const { data: deleted, error } = await supabase
    .from("quotes")
    .delete()
    .eq("id", id)
    .select("id, numero_cotizacion, cliente_empresa, usuario_id, total")
    .single();

  if (error || !deleted) {
    // RLS silently filters rows it won't let you touch -- from the caller's
    // perspective that's indistinguishable from "not found or not allowed".
    return NextResponse.json({ error: "No se pudo eliminar (no encontrada o sin permiso)" }, { status: 403 });
  }

  await logAudit(supabase, profile, {
    accion: "eliminar",
    quoteId: null, // row is gone; keep numero_cotizacion as the text snapshot
    numeroCotizacion: deleted.numero_cotizacion,
    detalle: { cliente: deleted.cliente_empresa, total: deleted.total },
  });

  if (profile.role !== "admin") {
    // quote_id omitted: the row is gone, and notifications.quote_id would
    // otherwise reference an id that no longer exists in `quotes`.
    await notifyAdmins(supabase, profile, {
      mensaje: `${profile.nombre ?? profile.email} eliminó la cotización ${deleted.numero_cotizacion}`,
    });
  }

  return NextResponse.json({ ok: true });
}
