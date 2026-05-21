// components/dashboard/Header.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  userName: string;
  userEmail: string;
}

export function Header({ sidebarOpen, setSidebarOpen, userName, userEmail }: HeaderProps) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="h-16 border-b border-orange-500/20 bg-black/30 backdrop-blur-sm sticky top-0 z-30">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-gray-400">Dashboard</span>
            <span className="text-orange-500">/</span>
            <span className="text-white">Inicio</span>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-white text-sm font-medium">{userName}</p>
                <p className="text-gray-400 text-xs">{userEmail}</p>
              </div>
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-64 bg-gray-900 border border-orange-500/20 rounded-lg shadow-xl z-50"
                >
                  <div className="p-4 border-b border-orange-500/20">
                    <p className="text-white font-medium">{userName}</p>
                    <p className="text-gray-400 text-sm">{userEmail}</p>
                  </div>
                  <div className="p-2">
                    <button className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      Cerrar Sesión
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}