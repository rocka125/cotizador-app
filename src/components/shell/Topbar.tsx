"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconUser, IconBellRinging, IconPlus, IconMenu2 } from "@tabler/icons-react";
import { NotificationBell } from "./NotificationBell";

export function Topbar({
  title,
  userEmail,
  userName,
  userInitials,
  role,
  onLogout,
  onOpenMobileNav,
}: {
  title: string;
  userEmail: string;
  userName: string | null;
  userInitials: string;
  role: "admin" | "vendedor";
  onLogout: () => void;
  onOpenMobileNav: () => void;
}) {
  const [rate, setRate] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/exchange-rate")
      .then((r) => r.json())
      .then((d) => setRate(d?.MXN ?? null))
      .catch(() => {});
  }, []);

  return (
    <header
      className="flex items-center justify-between px-5 border-b"
      style={{
        height: 54,
        gridColumn: "1 / -1",
        background: "#000000",
        borderColor: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        // Explicit stacking context: without this, the dashboard's <main>
        // (zIndex:1 in AppShell) paints over this header's own z-50 dropdown
        // menus (notifications, user menu) instead of under them.
        position: "relative",
        zIndex: 30,
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileNav}
          className="md:hidden -ml-1 flex items-center justify-center w-8 h-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          title="Abrir menú"
        >
          <IconMenu2 size={18} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element -- plain <img>, bypasses the
            Next.js image-optimizer route entirely so a stale cached rendition can't get stuck */}
        <img src="/logo-icon.png" alt="Fortress8" width={30} height={30} className="shrink-0 rounded" />
        <span className="hidden sm:inline font-serif text-[15px] font-semibold text-white tracking-wide shrink-0">
          FORTRESS<span style={{ color: "var(--shell-accent, #F57B02)", fontStyle: "italic" }}>8</span>
        </span>
        {rate && (
          <span
            className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-white/40 rounded-full px-3 py-1 border shrink-0"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
          >
            USD/MXN <b className="text-[#8FE3A6] font-semibold">{rate.toFixed(2)}</b>
          </span>
        )}
        <span className="hidden lg:inline text-sm text-white/30 truncate">· {title}</span>
      </div>

      <div className="flex items-center gap-2.5">
        <span
          className="hidden sm:inline-flex items-center gap-1.5 text-xs text-white/50 rounded-full px-3 py-1.5 border"
          style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <IconBellRinging size={13} /> Notificaciones activas
        </span>

        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center justify-center rounded-full text-xs font-semibold text-white transition-shadow"
            style={{ width: 30, height: 30, background: "var(--shell-accent, #F57B02)" }}
            title={userEmail}
          >
            {userInitials || <IconUser size={16} />}
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div
                className="absolute right-0 top-10 w-56 rounded-xl border shadow-2xl z-50 overflow-hidden"
                style={{ background: "#15100e", borderColor: "rgba(255,255,255,0.08)" }}
              >
                <div className="px-4 py-3 text-xs font-medium text-white border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  {userName || userEmail} <span className="text-white/40">({role === "admin" ? "Admin" : "Vendedor"})</span>
                </div>
                <Link href="/cotizaciones" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                  Mis cotizaciones
                </Link>
                <Link href="/precios" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                  Lista de precios
                </Link>
                <Link href="/precios/comparar" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors">
                  Comparar listas
                </Link>
                <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>

        <Link
          href="/cotizaciones/nueva"
          title="Nueva cotización"
          className="flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 sm:px-4 py-2 text-[#1a0d04] shrink-0 transition-transform hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, var(--shell-accent, #F57B02), var(--shell-accent2, #E2471B))" }}
        >
          <IconPlus size={14} /> <span className="hidden sm:inline">Nueva</span>
        </Link>
      </div>
    </header>
  );
}
