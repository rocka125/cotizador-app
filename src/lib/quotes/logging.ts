// Shared side-effects for every quote mutation: audit trail, seguimiento
// auto-note, and in-app notifications. Ported from the PHP app's
// auditoria_helper.php / notificar_admins() behavior. All writes go through
// the caller's own RLS-scoped session (see migrations 0008/0009) — nothing
// here needs elevated privileges.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "@/lib/auth/getCurrentProfile";

type Db = SupabaseClient;

export async function logAudit(
  supabase: Db,
  actor: Profile,
  params: {
    accion: "crear" | "editar" | "eliminar" | "cambio_estado" | "enviar_email";
    quoteId?: string | null;
    numeroCotizacion: string;
    detalle?: Record<string, unknown>;
  }
) {
  await supabase.from("audit_log").insert({
    tipo: "cotizacion",
    usuario_id: actor.id,
    usuario_nombre: actor.nombre ?? actor.email,
    accion: params.accion,
    quote_id: params.quoteId ?? null,
    numero_cotizacion: params.numeroCotizacion,
    detalle: params.detalle ?? null,
  });
}

export async function logFollowup(
  supabase: Db,
  actor: Profile,
  params: { quoteId: string; descripcion: string; tipo?: "nota" | "email" | "llamada" | "whatsapp" | "visita" }
) {
  await supabase.from("quote_followups").insert({
    quote_id: params.quoteId,
    usuario_id: actor.id,
    tipo: params.tipo ?? "nota",
    descripcion: params.descripcion,
  });
}

async function getAdminIds(supabase: Db, exceptUserId: string): Promise<string[]> {
  const { data } = await supabase.from("profiles").select("id").eq("role", "admin");
  return (data ?? []).map((r) => r.id as string).filter((id) => id !== exceptUserId);
}

// Non-admin created/edited a quote -> notify every admin (except the actor,
// in case an admin's own account somehow triggers this path).
export async function notifyAdmins(
  supabase: Db,
  actor: Profile,
  params: { quoteId?: string | null; mensaje: string }
) {
  const adminIds = await getAdminIds(supabase, actor.id);
  if (adminIds.length === 0) return;
  await supabase.from("notifications").insert(
    adminIds.map((usuario_id) => ({
      usuario_id,
      quote_id: params.quoteId ?? null,
      mensaje: params.mensaje,
      creado_por: actor.id,
    }))
  );
}

// Admin changed status / edited someone else's quote -> notify the owner.
export async function notifyUser(
  supabase: Db,
  actor: Profile,
  params: { targetUserId: string; quoteId?: string | null; mensaje: string }
) {
  if (params.targetUserId === actor.id) return; // don't notify yourself
  await supabase.from("notifications").insert({
    usuario_id: params.targetUserId,
    quote_id: params.quoteId ?? null,
    mensaje: params.mensaje,
    creado_por: actor.id,
  });
}
