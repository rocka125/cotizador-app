"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import type { DashboardStats } from "@/lib/quotes/data";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

interface ProfileLite {
  id: string;
  nombre: string | null;
  email: string;
}

const ESTADO_COLORS: Record<string, string> = {
  pendiente: "#f59e0b",
  aprobada: "#4ade80",
  rechazada: "#ef4444",
};

function money(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}
    >
      <p className="text-xs uppercase tracking-wider text-white/40 mb-2">{label}</p>
      <p className="text-2xl font-bold" style={{ color: accent ?? "#fff" }}>
        {value}
      </p>
    </div>
  );
}

export function DashboardClient({
  stats,
  profilesById,
  userName,
}: {
  stats: DashboardStats;
  profilesById: Record<string, ProfileLite>;
  userName: string;
}) {
  const [exchangeRate, setExchangeRate] = useState<{ MXN: number; EUR: number; live: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then(setExchangeRate)
      .catch(() => {});
  }, []);

  const conversionRate = stats.totalQuotes > 0 ? Math.round((stats.approvedCount / stats.totalQuotes) * 100) : 0;

  const monthlyData = {
    labels: stats.monthlyVolume.map((m) => {
      const [y, mo] = m.month.split("-");
      return new Date(Number(y), Number(mo) - 1).toLocaleDateString("es-MX", { month: "short" });
    }),
    datasets: [
      {
        label: "Cotizaciones",
        data: stats.monthlyVolume.map((m) => m.count),
        backgroundColor: "#FF8A3D",
        borderRadius: 6,
      },
    ],
  };

  const estadoData = {
    labels: ["Pendiente", "Aprobada", "Rechazada"],
    datasets: [
      {
        data: [stats.pendingCount, stats.approvedCount, stats.rejectedCount],
        backgroundColor: [ESTADO_COLORS.pendiente, ESTADO_COLORS.aprobada, ESTADO_COLORS.rechazada],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      <div
        className="rounded-2xl p-6 border"
        style={{
          background: "linear-gradient(135deg, rgba(255,138,61,0.12), rgba(229,72,24,0.04))",
          borderColor: "rgba(255,138,61,0.2)",
        }}
      >
        <h1 className="text-2xl font-serif italic text-white mb-1">¡Bienvenido, {userName}! 👋</h1>
        <p className="text-white/50 text-sm">Resumen de cotizaciones y actividad reciente.</p>
        {exchangeRate && (
          <div className="mt-3 inline-flex items-center gap-3 text-xs text-white/60 bg-black/20 rounded-full px-3 py-1.5">
            <span>1 USD = {exchangeRate.MXN?.toFixed(2)} MXN</span>
            <span>·</span>
            <span>1 USD = {exchangeRate.EUR?.toFixed(2)} EUR</span>
            {!exchangeRate.live && <span className="text-white/30">(aprox.)</span>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total cotizaciones" value={String(stats.totalQuotes)} />
        <KpiCard label="Monto total (USD)" value={money(stats.totalAmountUsd)} accent="#FF8A3D" />
        <KpiCard label="Tasa de aprobación" value={`${conversionRate}%`} accent="#4ade80" />
        <KpiCard label="Pendientes" value={String(stats.pendingCount)} accent="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="lg:col-span-2 rounded-2xl p-5 border"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <h3 className="text-sm font-semibold text-white/70 mb-4">Volumen mensual</h3>
          <div style={{ height: 220 }}>
            <Bar
              data={monthlyData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: "rgba(255,255,255,0.5)" }, grid: { display: false } },
                  y: { ticks: { color: "rgba(255,255,255,0.5)" }, grid: { color: "rgba(255,255,255,0.05)" }, beginAtZero: true },
                },
              }}
            />
          </div>
        </div>

        <div
          className="rounded-2xl p-5 border flex flex-col items-center"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <h3 className="text-sm font-semibold text-white/70 mb-4 self-start">Estados</h3>
          <div style={{ height: 180, width: 180 }}>
            <Doughnut
              data={estadoData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom", labels: { color: "rgba(255,255,255,0.6)", boxWidth: 10, font: { size: 10 } } } },
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="rounded-2xl p-5 border"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white/70">Cotizaciones recientes</h3>
            <Link href="/cotizaciones" className="text-xs text-[var(--shell-accent)] hover:underline">
              Ver todas →
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recentQuotes.length === 0 && <p className="text-white/30 text-sm">Sin cotizaciones aún.</p>}
            {stats.recentQuotes.map((q) => {
              const owner = profilesById[q.usuario_id];
              return (
                <Link
                  key={q.id}
                  href={`/cotizaciones/${q.id}/ver`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{q.cliente_empresa || q.numero_cotizacion}</p>
                    <p className="text-xs text-white/40">
                      {q.numero_cotizacion} · {owner?.nombre || owner?.email || "—"}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-white">
                      {Number(q.total).toLocaleString("es-MX", { maximumFractionDigits: 0 })} {q.moneda_code}
                    </p>
                    <span
                      className="text-[10px] font-bold uppercase"
                      style={{ color: ESTADO_COLORS[q.estado] ?? "#fff" }}
                    >
                      {q.estado}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div
          className="rounded-2xl p-5 border"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <h3 className="text-sm font-semibold text-white/70 mb-4">Próximas a vencer (7 días)</h3>
          <div className="space-y-2">
            {stats.proximasAVencer.length === 0 && <p className="text-white/30 text-sm">Ninguna por ahora.</p>}
            {stats.proximasAVencer.map((q) => (
              <Link
                key={q.id}
                href={`/cotizaciones/${q.id}/ver`}
                className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <p className="text-sm text-white truncate">{q.cliente_empresa || q.numero_cotizacion}</p>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
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
        </div>
      </div>
    </div>
  );
}
