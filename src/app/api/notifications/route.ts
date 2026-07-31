import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, quote_id, mensaje, leido, tipo, created_at")
    .eq("usuario_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const unreadCount = (data ?? []).filter((n) => !n.leido).length;
  return NextResponse.json({ notifications: data ?? [], unreadCount });
}

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { accion, id } = (await request.json()) as { accion: "marcar_leida" | "marcar_todas"; id?: string };
  const supabase = await createClient();

  if (accion === "marcar_leida" && id) {
    const { error } = await supabase.from("notifications").update({ leido: true }).eq("id", id).eq("usuario_id", profile.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (accion === "marcar_todas") {
    const { error } = await supabase.from("notifications").update({ leido: true }).eq("usuario_id", profile.id).eq("leido", false);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
