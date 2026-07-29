import { redirect, notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { getQuoteById } from "@/lib/quotes/data";
import { quoteRowToFormState } from "@/lib/quotes/serialize";
import CotizacionForm from "@/components/quotes/CotizacionForm";

export default async function VerCotizacionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const quote = await getQuoteById(id);
  if (!quote) notFound();

  return (
    <CotizacionForm
      mode="ver"
      quoteId={quote.id}
      numeroCotizacion={quote.numero_cotizacion}
      ownerId={quote.usuario_id}
      currentUserId={profile.id}
      isAdmin={profile.role === "admin"}
      initial={quoteRowToFormState(quote)}
      initialEstado={quote.estado}
    />
  );
}
