import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { logAudit, notifyUser } from "@/lib/quotes/logging";

// Admin-only: send a standalone personalized note to the vendedor who owns
// the quote, independent of approving/rejecting or editing its content.
// Usable both from inside the quote editor/viewer and from the dossier grid.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (profile.role !== "admin") {
    return NextResponse.json({ error: "Solo un administrador puede enviar este mensaje" }, { status: 403 });
  }

  const { mensaje } = (await request.json()) as { mensaje?: string };
  const texto = mensaje?.trim();
  if (!texto) {
    return NextResponse.json({ error: "Escribe un mensaje" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, usuario_id, numero_cotizacion")
    .eq("id", id)
    .single();
  if (!quote) return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });

  if (quote.usuario_id === profile.id) {
    return NextResponse.json({ error: "Esta cotización es tuya" }, { status: 400 });
  }

  await notifyUser(supabase, profile, {
    targetUserId: quote.usuario_id,
    quoteId: id,
    mensaje: `💬 ${profile.nombre ?? profile.email} sobre ${quote.numero_cotizacion}: "${texto}"`,
    tipo: "mensaje",
  });

  await logAudit(supabase, profile, {
    accion: "mensaje",
    quoteId: id,
    numeroCotizacion: quote.numero_cotizacion,
    detalle: { destinatario: quote.usuario_id, mensaje: texto },
  });

  return NextResponse.json({ ok: true });
}
