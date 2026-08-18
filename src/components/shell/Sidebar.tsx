"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconFileInvoice,
  IconPhoneCall,
  IconTag,
  IconSearch,
  IconArrowsRightLeft,
  IconHistory,
  IconLogout,
  IconX,
} from "@tabler/icons-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; stroke?: number }>;
  matchSegment: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard, matchSegment: "dashboard" },
  { href: "/cotizaciones", label: "Cotizaciones", icon: IconFileInvoice, matchSegment: "cotizaciones" },
  { href: "/seguimiento", label: "Seguimiento", icon: IconPhoneCall, matchSegment: "seguimiento" },
];

const NAV_ITEMS_PRECIOS: NavItem[] = [
  { href: "/precios", label: "Lista de precios", icon: IconTag, matchSegment: "precios" },
  { href: "/precios/catalogo", label: "Catálogo", icon: IconSearch, matchSegment: "catalogo" },
  { href: "/precios/comparar", label: "Comparar listas", icon: IconArrowsRightLeft, matchSegment: "comparar" },
];

const AUDITORIA_ITEM: NavItem = { href: "/auditoria", label: "Auditoría", icon: IconHistory, matchSegment: "auditoria" };

export function Sidebar({
  isAdmin,
  onLogout,
  mobileOpen,
  onCloseMobile,
}: {
  isAdmin: boolean;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const activeSegment = pathname.split("/").filter(Boolean).pop() ?? "";

  return (
    <>
      {/* Desktop icon rail -- hidden below md, replaced by the drawer below */}
      <aside
        className="hidden md:flex flex-col items-center gap-1 py-3 border-r"
        style={{
          width: 56,
          gridRow: "2 / -1",
          background: "#000000",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        {NAV_ITEMS.map((item) => (
          <SidebarButton key={item.href} item={item} active={activeSegment === item.matchSegment} />
        ))}

        <div className="w-6 h-px my-1" style={{ background: "rgba(255,255,255,0.1)" }} />

        {NAV_ITEMS_PRECIOS.map((item) => (
          <SidebarButton key={item.href} item={item} active={activeSegment === item.matchSegment} />
        ))}

        {isAdmin && (
          <>
            <div className="w-6 h-px my-1" style={{ background: "rgba(255,255,255,0.1)" }} />
            <SidebarButton item={AUDITORIA_ITEM} active={activeSegment === "auditoria"} />
          </>
        )}

        <div className="flex-1" />

        <button
          onClick={onLogout}
          title="Cerrar sesión"
          className="flex items-center justify-center rounded-full transition-colors text-red-400 hover:bg-red-500/10 hover:text-red-300"
          style={{ width: 44, height: 44 }}
        >
          <IconLogout size={20} stroke={1.8} />
        </button>
      </aside>

      {/* Mobile drawer -- icon-only tooltips (hidden aside above) don't work
          on touch, so this is a full slide-in panel with labels instead,
          opened via the hamburger button in Topbar. */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/60" onClick={onCloseMobile} />
          <div
            className="absolute left-0 top-0 bottom-0 w-64 flex flex-col py-4 border-r shadow-2xl"
            style={{ background: "#0a0a0a", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-between px-4 mb-4">
              <span className="font-serif text-base font-semibold text-white tracking-wide">
                FORTRESS<span style={{ color: "var(--shell-accent, #F57B02)", fontStyle: "italic" }}>8</span>
              </span>
              <button onClick={onCloseMobile} className="text-white/50 hover:text-white p-1 -mr-1" title="Cerrar menú">
                <IconX size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 space-y-1">
              {NAV_ITEMS.map((item) => (
                <MobileNavLink key={item.href} item={item} active={activeSegment === item.matchSegment} onClick={onCloseMobile} />
              ))}
              <div className="h-px my-2 mx-1" style={{ background: "rgba(255,255,255,0.08)" }} />
              {NAV_ITEMS_PRECIOS.map((item) => (
                <MobileNavLink key={item.href} item={item} active={activeSegment === item.matchSegment} onClick={onCloseMobile} />
              ))}
              {isAdmin && (
                <>
                  <div className="h-px my-2 mx-1" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <MobileNavLink item={AUDITORIA_ITEM} active={activeSegment === "auditoria"} onClick={onCloseMobile} />
                </>
              )}
            </nav>

            <div className="px-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <button
                onClick={() => {
                  onCloseMobile();
                  onLogout();
                }}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <IconLogout size={18} stroke={1.8} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SidebarButton({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      title={item.label}
      className="group relative flex items-center justify-center rounded-full transition-colors"
      style={{
        width: 44,
        height: 44,
        color: active ? "var(--shell-accent, #F57B02)" : "rgba(255,255,255,0.55)",
        background: active ? "color-mix(in srgb, var(--shell-accent, #F57B02) 15%, transparent)" : "transparent",
      }}
    >
      <Icon size={20} stroke={1.8} />
      <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 z-50">
        {item.label}
      </span>
    </Link>
  );
}

function MobileNavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
      style={{
        color: active ? "var(--shell-accent, #F57B02)" : "rgba(255,255,255,0.75)",
        background: active ? "color-mix(in srgb, var(--shell-accent, #F57B02) 15%, transparent)" : "transparent",
      }}
    >
      <Icon size={18} stroke={1.8} />
      {item.label}
    </Link>
  );
}
