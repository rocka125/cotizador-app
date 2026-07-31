import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { getQuoteById } from "@/lib/quotes/data";
import { renderQuotePdf } from "@/lib/quotes/pdf/render";
import { sendQuoteEmail } from "@/lib/email/sendQuoteEmail";
import { logAudit, logFollowup } from "@/lib/quotes/logging";

export const runtime = "nodejs";

let cachedLogoDataUri: string | null = null;
function getLogoDataUri(): string {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  const bytes = readFileSync(path.join(process.cwd(), "public", "logo.png"));
  cachedLogoDataUri = `data:image/png;base64,${bytes.toString("base64")}`;
  return cachedLogoDataUri;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const quote = await getQuoteById(id); // RLS-scoped
  if (!quote) return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 });

  const { to, mensaje } = (await request.json()) as { to: string; mensaje?: string };
  if (!to?.trim() || !to.includes("@")) {
    return NextResponse.json({ error: "Correo de destino inválido" }, { status: 400 });
  }

  const emailToken = randomUUID();
  const supabase = await createClient();

  // Sending a quote is a strong signal it belongs on the Seguimiento board --
  // un-hide it even if it was previously deleted from that board (see
  // toggleOcultar in seguimiento/actions.ts).
  //
  // Reset email_opened_at/email_open_count on every (re)send: a fresh
  // email_token starts a brand-new open-tracking cycle, and the previous
  // opened state (whether from an earlier send or from the legacy PHP data
  // import) must not leak into it. Otherwise the quote shows "abierta"
  // instantly regardless of whether *this* email was actually opened, and
  // record_email_open() thinks it's already seen an open, so it skips the
  // seguimiento entry + notification when the client genuinely opens it.
  const { error: tokenError } = await supabase
    .from("quotes")
    .update({ email_token: emailToken, seguimiento_oculto: false, email_opened_at: null, email_open_count: 0 })
    .eq("id", id);
  if (tokenError) return NextResponse.json({ error: tokenError.message }, { status: 500 });

  try {
    const pdfBuffer = await renderQuotePdf(quote, getLogoDataUri());
    await sendQuoteEmail({ quote, to: to.trim(), mensaje: mensaje?.trim(), pdfBuffer, emailToken });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? `No se pudo enviar el correo: ${e.message}` : "No se pudo enviar el correo" },
      { status: 502 }
    );
  }

  await logAudit(supabase, profile, {
    accion: "enviar_email",
    quoteId: id,
    numeroCotizacion: quote.numero_cotizacion,
    detalle: { email_destino: to.trim() },
  });
  await logFollowup(supabase, profile, {
    quoteId: id,
    tipo: "email" as const,
    descripcion: `Cotización ${quote.numero_cotizacion} enviada por correo a ${to.trim()}.`,
  });

  return NextResponse.json({ ok: true });
}
