import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { listAuditLog, getAuditStats } from "@/lib/quotes/data";
import { AuditTimeline } from "@/components/auditoria/AuditTimeline";

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; page?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/dashboard");

  const { tipo, page } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const tipoParam = (tipo as "sesion" | "cotizacion" | "todo") ?? "todo";

  const [{ items, total, pageSize }, stats] = await Promise.all([
    listAuditLog({ tipo: tipoParam, page: pageNum }),
    getAuditStats(),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Logins hoy</p>
          <p className="text-2xl font-bold text-white">{stats.loginsHoy}</p>
        </div>
        <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Creadas hoy</p>
          <p className="text-2xl font-bold text-green-400">{stats.creadasHoy}</p>
        </div>
        <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Editadas hoy</p>
          <p className="text-2xl font-bold text-blue-400">{stats.editadasHoy}</p>
        </div>
        <div className="rounded-2xl border p-5" style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-xs uppercase tracking-wider text-white/40 mb-1">Eliminadas (total)</p>
          <p className="text-2xl font-bold text-red-400">{stats.eliminadasTotal}</p>
        </div>
      </div>

      <AuditTimeline items={items} total={total} page={pageNum} pageSize={pageSize} currentTipo={tipoParam} />
    </div>
  );
}
