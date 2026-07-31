import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { logAudit, logFollowup, notifyUser } from "@/lib/quotes/logging";
import type { EstadoCotizacion } from "@/lib/quotes/types";

const VALID_ESTADOS: EstadoCotizacion[] = ["pendiente", "aprobada", "rechazada"];

// Admin-only quick status change (Aprobar/Rechazar buttons on the dossier
// grid) -- independent of the full content-edit endpoint in [id]/route.ts.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (profile.role !== "admin") {
    return NextResponse.json({ error: "Solo un administrador puede cambiar el estado" }, { status: 403 });
  }

  const { estado } = (await request.json()) as { estado: EstadoCotizacion };
  if (!VALID_ESTADOS.includes(estado)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("quotes")
    .select("id, usuario_id, estado, numero_cotizacion")
    .eq("id", id)
    .single();
  if (!existing) return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });

  if (existing.estado === estado) {
    return NextResponse.json({ id, estado }); // idempotent no-op
  }

  const { error } = await supabase.from("quotes").update({ estado }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit(supabase, profile, {
    accion: "cambio_estado",
    quoteId: id,
    numeroCotizacion: existing.numero_cotizacion,
    detalle: { estado_anterior: existing.estado, estado_nuevo: estado },
  });
  await logFollowup(supabase, profile, {
    quoteId: id,
    descripcion: `Estado cambiado de "${existing.estado}" a "${estado}".`,
  });
  await notifyUser(supabase, profile, {
    targetUserId: existing.usuario_id,
    quoteId: id,
    mensaje: `Tu cotización ${existing.numero_cotizacion} fue marcada como ${estado}.`,
    tipo: "estado",
  });

  return NextResponse.json({ id, estado });
}
