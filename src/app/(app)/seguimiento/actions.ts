"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";

const TIPOS = ["llamada", "email", "visita", "whatsapp", "nota"] as const;
type Tipo = (typeof TIPOS)[number];

export async function logContact(params: {
  quoteId: string;
  tipo: Tipo;
  descripcion: string;
  proximoContacto?: string | null;
}) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("No autenticado");

  const supabase = await createClient();
  const { error } = await supabase.from("quote_followups").insert({
    quote_id: params.quoteId,
    usuario_id: profile.id,
    tipo: params.tipo,
    descripcion: params.descripcion,
    proximo_contacto: params.proximoContacto || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/seguimiento");
}

export async function deleteContact(followupId: string) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("No autenticado");

  const supabase = await createClient();
  const { error } = await supabase.from("quote_followups").delete().eq("id", followupId);
  if (error) throw new Error(error.message);
  revalidatePath("/seguimiento");
}

export async function toggleOcultar(quoteId: string, oculto: boolean) {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("No autenticado");

  const supabase = await createClient();
  const { error } = await supabase.from("quotes").update({ seguimiento_oculto: oculto }).eq("id", quoteId);
  if (error) throw new Error(error.message);
  revalidatePath("/seguimiento");
}
