"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Solo un administrador puede gestionar versiones de la lista de precios");
  }
  return profile;
}

export async function activateVersion(versionId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.rpc("activate_price_list_version", { p_id: versionId });
  if (error) throw new Error(error.message);
  revalidatePath("/precios");
}

export async function deleteVersion(versionId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("price_list_versions").delete().eq("id", versionId);
  if (error) throw new Error(error.message);
  revalidatePath("/precios");
}
