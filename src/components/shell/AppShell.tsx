"use client";

import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { themeForPathname } from "@/lib/theme/pageThemes";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  cotizaciones: "Cotizaciones",
  seguimiento: "Seguimiento",
  precios: "Lista de precios",
  "precios/comparar": "Comparar listas",
  auditoria: "Auditoría",
};

function initialsFrom(nombre: string | null, email: string) {
  const base = nombre?.trim() || email.split("@")[0];
  return base.slice(0, 2).toUpperCase();
}

export function AppShell({
  role,
  userId,
  userEmail,
  userName,
  children,
}: {
  role: "admin" | "vendedor";
  userId: string;
  userEmail: string;
  userName: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = themeForPathname(pathname);
  const segments = pathname.split("/").filter(Boolean);
  const twoSegmentKey = segments.slice(0, 2).join("/");
  const title = PAGE_TITLES[twoSegmentKey] ?? PAGE_TITLES[segments[0] ?? "dashboard"] ?? "Fortress8";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.from("audit_log").insert({
      tipo: "sesion",
      usuario_id: userId,
      usuario_nombre: userName ?? userEmail,
      accion: "logout",
    });
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen grid"
      style={{
        gridTemplateColumns: "56px 1fr",
        gridTemplateRows: "54px 1fr",
        background: theme.bg,
        // Exposed as CSS custom properties so any descendant (sidebar,
        // topbar, page content) can theme itself off the current route
        // without prop-drilling.
        ["--shell-bg" as string]: theme.bg,
        ["--shell-accent" as string]: theme.accent,
        ["--shell-accent2" as string]: theme.accent2,
      }}
    >
      <Sidebar isAdmin={role === "admin"} onLogout={handleLogout} />
      <Topbar title={title} userEmail={userEmail} userInitials={initialsFrom(userName, userEmail)} />
      <main
        className="overflow-y-auto"
        style={{ gridColumn: "2 / -1", gridRow: "2 / -1" }}
      >
        {children}
      </main>
    </div>
  );
}
