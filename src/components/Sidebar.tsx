// components/Sidebar.tsx — actualizado con tab "Lista de precios"
"use client";

import { motion } from "framer-motion";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  onLogout: () => void;
  userName: string;
}

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: "quotes",
    label: "Cotizaciones",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: "new-quote",
    label: "Nueva Cotización",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    id: "price-list",
    label: "Lista de precios",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: "clients",
    label: "Clientes",
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function Sidebar({ open, setOpen, activeTab, setActiveTab, onLogout, userName }: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-40"
          onClick={() => setOpen(false)}
        />
      )}

      <motion.aside
        initial={false}
        animate={{ width: open ? 256 : 80 }}
        className="fixed left-0 top-0 h-full bg-gradient-to-b from-gray-900 to-black border-r border-orange-500/20 z-50 flex flex-col overflow-hidden"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-orange-500/20 shrink-0">
          {open ? (
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-300 bg-clip-text text-transparent whitespace-nowrap">
              Fortress8
            </span>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
          )}
        </div>

        {/* User info */}
        {open && (
          <div className="px-4 py-3 border-b border-orange-500/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-semibold">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{userName}</p>
                <p className="text-xs text-gray-400">Comercial</p>
              </div>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={!open ? item.label : undefined}
                className={`relative w-full flex items-center gap-3 px-5 py-3 transition-colors group ${
                  isActive
                    ? "text-orange-400"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 top-0 w-1 h-full bg-orange-500 rounded-r-full"
                  />
                )}
                {/* Active background */}
                {isActive && (
                  <div className="absolute inset-0 bg-orange-500/8 pointer-events-none" />
                )}

                <span className={`shrink-0 transition-colors ${isActive ? "text-orange-400" : "text-gray-500 group-hover:text-gray-300"}`}>
                  {item.icon}
                </span>

                {open && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}

                {/* Tooltip cuando sidebar cerrado */}
                {!open && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-orange-500/20 shrink-0">
          <button
            onClick={onLogout}
            title={!open ? "Cerrar Sesión" : undefined}
            className="w-full flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 transition-colors rounded-lg hover:bg-red-500/10 group"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {open && <span className="text-sm">Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}