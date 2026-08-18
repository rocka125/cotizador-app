import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import type { ParsedProduct } from "@/lib/priceList/parseExcel";

const BATCH_SIZE = 500;

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (profile.role !== "admin") {
    return NextResponse.json({ error: "Solo un administrador puede importar listas de precios" }, { status: 403 });
  }

  const { nombre, descripcion, products } = (await request.json()) as {
    nombre: string;
    descripcion?: string;
    products: ParsedProduct[];
  };

  if (!nombre?.trim()) return NextResponse.json({ error: "Ponle un nombre a la versión" }, { status: 400 });
  if (!products?.length) return NextResponse.json({ error: "No hay productos para importar" }, { status: 400 });

  const supabase = await createClient();

  const { data: version, error: versionError } = await supabase
    .from("price_list_versions")
    .insert({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      activa: false,
      total_skus: products.length,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (versionError || !version) {
    return NextResponse.json({ error: versionError?.message ?? "Error al crear la versión" }, { status: 500 });
  }

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE).map((p) => ({
      version_id: version.id,
      categoria: p.categoria,
      sku: p.sku,
      descripcion: p.descripcion,
      unit_name: p.unitName || null,
      precio: p.precio,
      precio_1yr: p.precio1yr,
      precio_2yr: p.precio2yr,
      precio_3yr: p.precio3yr,
      precio_4yr: p.precio4yr,
      precio_5yr: p.precio5yr,
      activo: true,
    }));
    const { error: batchError } = await supabase.from("price_list_items").insert(batch);
    if (batchError) {
      // Best-effort cleanup of the partially-inserted version so it doesn't
      // linger as a broken, unusable entry in the version history.
      await supabase.from("price_list_versions").delete().eq("id", version.id);
      return NextResponse.json({ error: `Error al guardar productos: ${batchError.message}` }, { status: 500 });
    }
  }

  const { error: activateError } = await supabase.rpc("activate_price_list_version", { p_id: version.id });
  if (activateError) {
    return NextResponse.json({ error: `Versión guardada pero no se pudo activar: ${activateError.message}` }, { status: 500 });
  }

  return NextResponse.json({ id: version.id, total: products.length });
}
