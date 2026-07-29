import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface Profile {
  id: string;
  email: string;
  nombre: string | null;
  role: "admin" | "vendedor";
}

// cache() de-dupes repeated calls within a single request (Server
// Components, layouts, and Route Handlers can all call this freely without
// firing redundant auth/profile lookups).
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, nombre, role")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return profile as Profile;
});
