import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";
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

  // Mobile has no room for list + detail side by side, so it behaves like a
  // master-detail stack instead: show only the board until a quote is
  // picked (?id=...), then swap to only the detail pane with a "back" link.
  // Desktop keeps the persistent two-column layout regardless.
  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[340px_1fr]">
      <div
        className={`${selected ? "hidden md:block" : "block"} border-r overflow-y-auto`}
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <SeguimientoBoard items={items} profilesById={profilesById} selectedId={selected?.id} />
      </div>
      <div className={selected ? "block" : "hidden md:block"}>
        {selected ? (
          <>
            <Link
              href="/seguimiento"
              className="md:hidden flex items-center gap-1.5 px-4 py-3 text-sm text-white/60 hover:text-white border-b"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <IconArrowLeft size={16} /> Volver a la lista
            </Link>
            <DetailPane quote={selected} followups={followups} profilesById={profilesById} />
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-white/30 text-sm">
            Selecciona una cotización para ver su historial de contacto.
          </div>
        )}
      </div>
    </div>
  );
}
