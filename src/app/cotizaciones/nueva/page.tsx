import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import CotizacionForm from "@/components/quotes/CotizacionForm";

// Full-bleed editor, deliberately outside the (app) icon-sidebar shell — see
// the port plan's decision to preserve the print-friendly, distraction-free
// editing surface (matches the PHP source's own layout split).
export default async function NuevaCotizacionPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return <CotizacionForm mode="nueva" currentUserId={profile.id} isAdmin={profile.role === "admin"} />;
}
