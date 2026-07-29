import { createClient } from "@/lib/supabase/server";
import { listSeguimientoBoard, getFollowupsForQuote } from "@/lib/quotes/data";
import { SeguimientoBoard } from "@/components/seguimiento/SeguimientoBoard";
import { DetailPane } from "@/components/seguimiento/DetailPane";

export default async function SeguimientoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const items = await listSeguimientoBoard();

  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("id, nombre, email");
  const profilesById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const selected = id ? items.find((i) => i.id === id) : undefined;
  const followups = selected ? await getFollowupsForQuote(selected.id) : [];

  return (
    <div className="grid h-full" style={{ gridTemplateColumns: "340px 1fr" }}>
      <div className="border-r overflow-y-auto" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <SeguimientoBoard items={items} profilesById={profilesById} selectedId={selected?.id} />
      </div>
      <div>
        {selected ? (
          <DetailPane quote={selected} followups={followups} profilesById={profilesById} />
        ) : (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">
            Selecciona una cotización para ver su historial de contacto.
          </div>
        )}
      </div>
    </div>
  );
}
