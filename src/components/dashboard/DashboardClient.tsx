"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  IconMailCheck,
  IconEye,
  IconMessageCircle,
  IconClockExclamation,
  IconAlertTriangle,
  IconClock,
  IconCheck,
  IconX,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import type { DashboardStats, SeguimientoSummary } from "@/lib/quotes/data";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip, Legend);

interface ProfileLite {
  id: string;
  nombre: string | null;
  email: string;
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "#FFC876",
  aprobada: "#8FE3A6",
  rechazada: "#FF7A6E",
};

const PRODUCT_COLORS = ["#FF7A6E", "#FF8A3D", "#FFA85C", "#FFC876", "rgba(255,200,118,.6)", "rgba(255,200,118,.35)"];

function money(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "—";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function Glass({ className, children, style }: { className?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-3xl border backdrop-blur-md p-5 ${className ?? ""}`}
      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)", ...style }}
    >
      {children}
    </div>
  );
}

function Donut({ pct, color, label }: { pct: number; color: string; label: string }) {
  const circ = 125.66; // 2πr, r=20
  const fill = Math.round((pct / 100) * circ * 10) / 10;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="46" height="46" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="7" />
        <circle
          cx="26"
          cy="26"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={`${fill} ${Math.round((circ - fill) * 10) / 10}`}
          strokeLinecap="round"
          transform="rotate(-90 26 26)"
        />
      </svg>
      <div className="text-[13px] font-bold" style={{ color }}>{pct}%</div>
      <div className="text-[9.5px] text-white/40 text-center">{label}</div>
    </div>
  );
}

function HBar({ icon, label, value, pct, color }: { icon: React.ReactNode; label: string; value: number; pct: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] flex items-center gap-1.5" style={{ color }}>
          {icon} {label}
        </span>
        <span className="text-[13px] font-semibold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

export function DashboardClient({
  stats,
  seguimiento,
  profilesById,
  userName,
}: {
  stats: DashboardStats;
  seguimiento: SeguimientoSummary;
  profilesById: Record<string, ProfileLite>;
  userName: string;
}) {
  const [exchangeRate, setExchangeRate] = useState<{ MXN: number; EUR: number; live: boolean } | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then(setExchangeRate)
      .catch(() => {});
  }, []);

  const conversionRate = stats.totalQuotes > 0 ? Math.round((stats.approvedCount / stats.totalQuotes) * 100) : 0;
  const totalMes = stats.monthlyVolume.at(-1)?.count ?? 0;

  const evolutionData = {
    labels: stats.wave.labels,
    datasets: [
      {
        label: "Pendientes",
        data: stats.wave.pendientes,
        borderColor: ESTADO_COLORS.pendiente,
        backgroundColor: "rgba(255,200,118,0.18)",
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        fill: true,
        tension: 0.35,
      },
      {
        label: "Aprobadas",
        data: stats.wave.aprobadas,
        borderColor: ESTADO_COLORS.aprobada,
        backgroundColor: "rgba(143,227,166,0.16)",
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        fill: true,
        tension: 0.35,
      },
      {
        label: "Rechazadas",
        data: stats.wave.rechazadas,
        borderColor: ESTADO_COLORS.rechazada,
        backgroundColor: "rgba(255,122,110,0.16)",
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
        fill: true,
        tension: 0.35,
      },
    ],
  };
  const rangoActual = stats.wave.labels.length
    ? `${stats.wave.labels[0]} – ${stats.wave.labels.at(-1)}`
    : "";

  const pctPend = stats.totalQuotes > 0 ? Math.round((stats.pendingCount / stats.totalQuotes) * 100) : 0;
  const pctAprob = stats.totalQuotes > 0 ? Math.round((stats.approvedCount / stats.totalQuotes) * 100) : 0;
  const pctRech = stats.totalQuotes > 0 ? Math.round((stats.rejectedCount / stats.totalQuotes) * 100) : 0;

  const filteredQuotes = useMemo(() => {
    if (!search.trim()) return stats.recentQuotes;
    const q = search.trim().toLowerCase();
    return stats.recentQuotes.filter(
      (r) => r.cliente_empresa?.toLowerCase().includes(q) || r.numero_cotizacion.toLowerCase().includes(q)
    );
  }, [search, stats.recentQuotes]);

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Monday-first
  const maxTop = Math.max(1, ...stats.topProductos.map((p) => p.count));

  return (
    <div className="p-3 space-y-3">
      <div className="px-1">
        <h1 className="text-2xl font-serif italic text-white mb-1">¡Bienvenido, {userName}! 👋</h1>
        <p className="text-white/50 text-sm">Resumen de cotizaciones y actividad reciente.</p>
    
        
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* HERO: total cotizado */}
        <Glass className="col-span-12 md:col-span-5 relative overflow-hidden flex flex-col justify-between">
          <div
            className="absolute rounded-full pointer-events-none"
            style={{ right: -40, top: -40, width: 180, height: 180, border: "1px solid rgba(255,138,61,.22)" }}
          />
          <div>
            <p className="text-[11px] tracking-widest uppercase text-white/40">Total cotizado</p>
            <p className="font-serif text-5xl font-semibold my-3" style={{ background: "linear-gradient(135deg, var(--shell-accent2), var(--shell-accent))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              {money(stats.totalAmountUsd)}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-white/50 flex-wrap gap-2">
            <span>{stats.totalQuotes} cotizaciones en total</span>
            <span className="text-[#8FE3A6] font-semibold">↑ {totalMes} nuevas este mes</span>
          </div>
        </Glass>

        {/* EVOLUTION + donuts */}
        <Glass className="col-span-12 md:col-span-7">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-[15px] font-semibold text-white">Evolución de cotizaciones</h3>
            <span className="text-[11px] text-white/30">{rangoActual}</span>
          </div>
          <div style={{ height: 190 }}>
            <Line
              data={evolutionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: "rgba(255,255,255,0.5)", maxTicksLimit: 10 }, grid: { display: false } },
                  y: { ticks: { color: "rgba(255,255,255,0.5)", stepSize: 1 }, grid: { color: "rgba(255,255,255,0.05)" }, beginAtZero: true },
                },
              }}
            />
          </div>
          <div className="flex gap-4 text-[11px] text-white/50 mt-3 mb-2">
            <span className="flex items-center gap-1.5"><i className="inline-block w-2 h-2 rounded-full" style={{ background: ESTADO_COLORS.pendiente }} />Pendientes</span>
            <span className="flex items-center gap-1.5"><i className="inline-block w-2 h-2 rounded-full" style={{ background: ESTADO_COLORS.aprobada }} />Aprobadas</span>
            <span className="flex items-center gap-1.5"><i className="inline-block w-2 h-2 rounded-full" style={{ background: ESTADO_COLORS.rechazada }} />Rechazadas</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <Donut pct={pctPend} color={ESTADO_COLORS.pendiente} label="Pendientes" />
            <Donut pct={pctAprob} color={ESTADO_COLORS.aprobada} label="Aprobadas" />
            <Donut pct={pctRech} color={ESTADO_COLORS.rechazada} label="Rechazadas" />
          </div>
        </Glass>

        {/* KPI minis */}
        <Glass className="col-span-6 md:col-span-3">
          <p className="font-serif text-[27px] font-semibold" style={{ color: "var(--shell-accent)" }}>{stats.totalQuotes}</p>
          <p className="text-[11px] text-white/40 mt-1">Cotizaciones totales</p>
        </Glass>
        <Glass className="col-span-6 md:col-span-3">
          <p className="font-serif text-[27px] font-semibold text-[#8FE3A6]">{conversionRate}%</p>
          <p className="text-[11px] text-white/40 mt-1">Tasa de aprobación</p>
        </Glass>
        <Glass className="col-span-6 md:col-span-3">
          <p className="font-serif text-[27px] font-semibold text-[#FFC876]">{totalMes}</p>
          <p className="text-[11px] text-white/40 mt-1">Nuevas este mes</p>
        </Glass>
        <Link href="/seguimiento" className="col-span-6 md:col-span-3">
          <Glass className="h-full hover:border-white/20 transition-colors">
            <p className="font-serif text-[27px] font-semibold text-[#FF7A6E]">{seguimiento.urgentes}</p>
            <p className="text-[11px] text-white/40 mt-1">Sin respuesta +5 días</p>
          </Glass>
        </Link>

        {/* CLIENTES / cotizaciones recientes */}
        <Glass className="col-span-12 md:col-span-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-[15px] font-semibold text-white">Cotizaciones recientes</h3>
            <Link href="/cotizaciones" className="text-xs" style={{ color: "var(--shell-accent)" }}>Ver todas →</Link>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente o número..."
            className="w-full rounded-lg px-3 py-2 text-xs text-white mb-3 outline-none border"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
          />
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {filteredQuotes.length === 0 && <p className="text-white/30 text-sm py-4 text-center">Sin cotizaciones.</p>}
            {filteredQuotes.map((q) => {
              const owner = profilesById[q.usuario_id];
              const nombre = q.cliente_empresa || q.numero_cotizacion;
              return (
                <Link
                  key={q.id}
                  href={`/cotizaciones/${q.id}/ver`}
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, var(--shell-accent2), var(--shell-accent))", color: "#1a0d04" }}
                  >
                    {initials(nombre)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{nombre}</p>
                    <p className="text-[10.5px] text-white/40">
                      {q.numero_cotizacion} · {owner?.nombre || owner?.email || "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-white">
                      {Number(q.total).toLocaleString("es-MX", { maximumFractionDigits: 0 })} {q.moneda_code}
                    </p>
                    <span className="text-[10px] font-bold uppercase" style={{ color: ESTADO_COLORS[q.estado] ?? "#fff" }}>
                      {q.estado}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Glass>

        {/* SEGUIMIENTO summary */}
        <Glass className="col-span-12 md:col-span-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-[15px] font-semibold text-white">Seguimiento</h3>
            {seguimiento.urgentes > 0 ? (
              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase text-[#FF7A6E] border border-[#FF7A6E]/30 bg-[#FF7A6E]/10 rounded-full px-2 py-0.5">
                <IconAlertTriangle size={11} /> {seguimiento.urgentes} urgente{seguimiento.urgentes > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-[11px] text-white/30">{seguimiento.activas} activas</span>
            )}
          </div>
          <div className="space-y-2.5">
            <HBar icon={<IconMailCheck size={12} />} label="Enviados" value={seguimiento.enviadas} pct={seguimiento.activas ? (seguimiento.enviadas / seguimiento.activas) * 100 : 0} color="#5AA3FF" />
            <HBar icon={<IconEye size={12} />} label={`Abiertos${seguimiento.tasaApertura ? ` (${seguimiento.tasaApertura}%)` : ""}`} value={seguimiento.abiertas} pct={seguimiento.activas ? (seguimiento.abiertas / seguimiento.activas) * 100 : 0} color="#8FE3A6" />
            <HBar icon={<IconMessageCircle size={12} />} label="Con seguimiento" value={seguimiento.conSeguimiento} pct={seguimiento.activas ? (seguimiento.conSeguimiento / seguimiento.activas) * 100 : 0} color="var(--shell-accent)" />
            <HBar icon={<IconClockExclamation size={12} />} label="Sin respuesta +5d" value={seguimiento.urgentes} pct={seguimiento.activas ? (seguimiento.urgentes / seguimiento.activas) * 100 : 0} color="#FF7A6E" />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t text-center" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            <div>
              <p className="font-serif text-lg font-semibold text-white">{seguimiento.activas}</p>
              <p className="text-[9.5px] text-white/40">Total activas</p>
            </div>
            <div>
              <p className="font-serif text-lg font-semibold text-[#8FE3A6]">{seguimiento.abiertas}</p>
              <p className="text-[9.5px] text-white/40">Abiertas</p>
            </div>
            <div>
              <p className="font-serif text-lg font-semibold" style={{ color: "var(--shell-accent)" }}>{seguimiento.tasaApertura}%</p>
              <p className="text-[9.5px] text-white/40">Tasa apertura</p>
            </div>
          </div>
          <Link href="/seguimiento" className="block text-center text-xs mt-3" style={{ color: "var(--shell-accent)" }}>
            Ver centro de seguimiento →
          </Link>
        </Glass>

        {/* CALENDARIO */}
        <Glass className="col-span-12 md:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <IconChevronLeft size={14} className="text-white/30" />
            <span className="text-[11.5px] font-semibold text-white">{now.toLocaleDateString("es-MX", { month: "long", year: "numeric" })}</span>
            <IconChevronRight size={14} className="text-white/30" />
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
              <div key={i} className="text-[9px] text-white/30">{d}</div>
            ))}
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === now.getDate();
              const count = stats.calendarioMes[day] ?? 0;
              return (
                <div
                  key={day}
                  title={count ? `${count} cotización${count > 1 ? "es" : ""}` : undefined}
                  className="text-[10px] rounded-lg py-1 relative"
                  style={{
                    background: isToday ? "linear-gradient(135deg, #FFC876, var(--shell-accent))" : "rgba(255,255,255,0.02)",
                    color: isToday ? "#1a0d04" : "rgba(255,255,255,0.6)",
                    fontWeight: isToday || count ? 600 : 400,
                  }}
                >
                  {day}
                  {count > 0 && !isToday && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: "var(--shell-accent)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </Glass>

        {/* ESTADOS */}
        <Glass className="col-span-12 md:col-span-5">
          <h3 className="font-serif text-[15px] font-semibold text-white mb-3">Estados</h3>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { key: "pendiente", label: "Pendientes", icon: <IconClock size={15} />, color: ESTADO_COLORS.pendiente, count: stats.pendingCount, sum: stats.estadosSuma.pendiente },
              { key: "aprobada", label: "Aprobadas", icon: <IconCheck size={15} />, color: ESTADO_COLORS.aprobada, count: stats.approvedCount, sum: stats.estadosSuma.aprobada },
              { key: "rechazada", label: "Rechazadas", icon: <IconX size={15} />, color: ESTADO_COLORS.rechazada, count: stats.rejectedCount, sum: stats.estadosSuma.rechazada },
            ].map((e) => (
              <div key={e.key} className="rounded-2xl p-3 flex flex-col gap-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${e.color}26`, color: e.color }}>
                    {e.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-[19px] font-semibold" style={{ color: e.color }}>{e.count}</p>
                    <p className="text-[10px] text-white/40 truncate">{e.label}</p>
                  </div>
                </div>
                <div className="flex items-baseline justify-between pt-2 border-t text-white/60 text-[13px] font-semibold" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <span className="truncate">{money(e.sum)}</span>
                  <span className="text-[9px] text-white/30 shrink-0">USD</span>
                </div>
              </div>
            ))}
          </div>
        </Glass>

        {/* TOP PRODUCTOS */}
        <Glass className="col-span-12 md:col-span-7">
          <h3 className="font-serif text-[15px] font-semibold text-white mb-3">
            Top productos <span className="text-[11px] text-white/30 font-normal">Más cotizados</span>
          </h3>
          {stats.topProductos.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-6">Sin productos aún.</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {stats.topProductos.map((p, i) => (
                <div
                  key={p.label}
                  title={`${p.label}: ${p.count} uds · ${money(p.total)}`}
                  className="flex items-center justify-between px-3 h-7 rounded-lg text-[10.5px] font-semibold text-[#1a0d04]"
                  style={{ width: `${Math.max(15, Math.round((p.count / maxTop) * 100))}%`, background: PRODUCT_COLORS[i % PRODUCT_COLORS.length] }}
                >
                  <span className="truncate max-w-[70%]">{p.label}</span>
                  <span className="opacity-80 shrink-0">{p.count}</span>
                </div>
              ))}
            </div>
          )}
        </Glass>

        {/* PRÓXIMAS A VENCER */}
        <Glass className="col-span-12">
          <h3 className="font-serif text-[15px] font-semibold text-white mb-3">Próximas a vencer (7 días)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
            {stats.proximasAVencer.length === 0 && <p className="text-white/30 text-sm">Ninguna por ahora.</p>}
            {stats.proximasAVencer.map((q) => (
              <Link
                key={q.id}
                href={`/cotizaciones/${q.id}/ver`}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <p className="text-sm text-white truncate">{q.cliente_empresa || q.numero_cotizacion}</p>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2"
                  style={{
                    background: q.diasRestantes <= 2 ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                    color: q.diasRestantes <= 2 ? "#ef4444" : "#f59e0b",
                  }}
                >
                  {q.diasRestantes === 0 ? "Vence hoy" : `${q.diasRestantes}d`}
                </span>
              </Link>
            ))}
          </div>
        </Glass>
      </div>
    </div>
  );
}
