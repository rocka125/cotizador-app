"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconLayoutDashboard,
  IconFileInvoice,
  IconPhoneCall,
  IconTag,
  IconArrowsRightLeft,
  IconHistory,
  IconLogout,
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
  { href: "/precios/comparar", label: "Comparar listas", icon: IconArrowsRightLeft, matchSegment: "comparar" },
];

export function Sidebar({
  isAdmin,
  onLogout,
}: {
  isAdmin: boolean;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const activeSegment = pathname.split("/").filter(Boolean).pop() ?? "";

  return (
    <aside
      className="flex flex-col items-center gap-1 py-3 border-r"
      style={{
        width: 56,
        gridRow: "1 / -1",
        background: "rgba(0,0,0,0.55)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      {NAV_ITEMS.map((item) => (
        <SidebarButton
          key={item.href}
          item={item}
          active={activeSegment === item.matchSegment}
        />
      ))}

      <div className="w-6 h-px my-1" style={{ background: "rgba(255,255,255,0.1)" }} />

      {NAV_ITEMS_PRECIOS.map((item) => (
        <SidebarButton
          key={item.href}
          item={item}
          active={activeSegment === item.matchSegment}
        />
      ))}

      {isAdmin && (
        <>
          <div className="w-6 h-px my-1" style={{ background: "rgba(255,255,255,0.1)" }} />
          <SidebarButton
            item={{ href: "/auditoria", label: "Auditoría", icon: IconHistory, matchSegment: "auditoria" }}
            active={activeSegment === "auditoria"}
          />
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
