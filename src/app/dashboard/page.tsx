// app/dashboard/page.tsx — con tab "Lista de precios" integrado
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { StatsCards } from "@/components/StatsCards";
import { RecentQuotes } from "@/components/RecentQuotes";
import { ClientsList } from "@/components/ClientsList";
import { PriceListViewer } from "@/components/PriceListViewer";
import CotizacionForm from "@/components/quotes/CotizacionForm";

type TabId = "dashboard" | "quotes" | "new-quote" | "price-list" | "clients";

interface Quote {
  id: string;
  quote_number: string;
  client_name: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "sent";
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState({
    totalQuotes: 0,
    totalAmount: 0,
    pendingQuotes: 0,
    approvedQuotes: 0,
  });

  useEffect(() => {
    checkUser();
    fetchQuotes();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUser(user);
    setLoading(false);
  }

  async function fetchQuotes() {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching quotes:", error);
      return;
    }
    if (data) {
      setQuotes(data);
      calculateStats(data);
    }
  }

  function calculateStats(quotesData: Quote[]) {
    const total = quotesData.reduce((sum, q) => sum + q.amount, 0);
    setStats({
      totalQuotes: quotesData.length,
      totalAmount: total,
      pendingQuotes: quotesData.filter((q) => q.status === "pending").length,
      approvedQuotes: quotesData.filter((q) => q.status === "approved").length,
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // Título dinámico según tab activo
  const tabTitles: Record<TabId, string> = {
    dashboard: "Inicio",
    quotes: "Cotizaciones",
    "new-quote": "Nueva Cotización",
    "price-list": "Lista de precios",
    clients: "Clientes",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950">
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={(tab: TabId) => setActiveTab(tab)}
        onLogout={handleLogout}
        userName={user?.email?.split("@")[0] || "Usuario"}
      />

      <div
        className={`transition-all duration-300 ${
          sidebarOpen ? "lg:pl-64" : "lg:pl-20"
        }`}
      >
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          userName={user?.email?.split("@")[0] || "Usuario"}
          userEmail={user?.email}
        />

        <main className="p-6">
          <AnimatePresence mode="wait">

            {/* ── Dashboard ── */}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-r from-orange-600/10 via-orange-500/5 to-transparent rounded-2xl border border-orange-500/20 p-6">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    ¡Bienvenido de vuelta, {user?.email?.split("@")[0]}! 👋
                  </h1>
                  <p className="text-gray-400">
                    Aquí está el resumen de tus cotizaciones y actividades recientes.
                  </p>
                </div>
                <StatsCards stats={stats} />
                <RecentQuotes quotes={quotes.slice(0, 5)} />
              </motion.div>
            )}

            {/* ── Cotizaciones ── */}
            {activeTab === "quotes" && (
              <motion.div
                key="quotes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-gray-900/50 rounded-2xl border border-orange-500/20 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">
                      Todas las Cotizaciones
                    </h2>
                    <button
                      onClick={() => setActiveTab("new-quote")}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                      + Nueva Cotización
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-orange-500/20">
                          <th className="text-left py-3 text-gray-400 font-medium">N° Cotización</th>
                          <th className="text-left py-3 text-gray-400 font-medium">Cliente</th>
                          <th className="text-left py-3 text-gray-400 font-medium">Monto</th>
                          <th className="text-left py-3 text-gray-400 font-medium">Estado</th>
                          <th className="text-left py-3 text-gray-400 font-medium">Fecha</th>
                          <th className="text-left py-3 text-gray-400 font-medium">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotes.map((quote) => (
                          <tr
                            key={quote.id}
                            className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="py-3 text-white font-mono text-sm">
                              {quote.quote_number}
                            </td>
                            <td className="py-3 text-gray-300">{quote.client_name}</td>
                            <td className="py-3 text-white">
                              ${quote.amount.toLocaleString()}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  quote.status === "approved"
                                    ? "bg-green-500/20 text-green-400"
                                    : quote.status === "pending"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : quote.status === "rejected"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-blue-500/20 text-blue-400"
                                }`}
                              >
                                {quote.status === "approved"
                                  ? "Aprobada"
                                  : quote.status === "pending"
                                  ? "Pendiente"
                                  : quote.status === "rejected"
                                  ? "Rechazada"
                                  : "Enviada"}
                              </span>
                            </td>
                            <td className="py-3 text-gray-400 text-sm">
                              {new Date(quote.created_at).toLocaleDateString("es-MX")}
                            </td>
                            <td className="py-3">
                              <button className="text-orange-400 hover:text-orange-300 text-sm">
                                Ver detalles
                              </button>
                            </td>
                          </tr>
                        ))}
                        {quotes.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-gray-500">
                              No hay cotizaciones aún.{" "}
                              <button
                                onClick={() => setActiveTab("new-quote")}
                                className="text-orange-400 hover:text-orange-300"
                              >
                                Crear la primera →
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Nueva cotización ── */}
            {activeTab === "new-quote" && (
              <motion.div
                key="new-quote"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="rounded-2xl border border-orange-500/20 overflow-hidden"
              >
                <CotizacionForm />
              </motion.div>
            )}

            {/* ── Lista de precios ── */}
            {activeTab === "price-list" && (
              <motion.div
                key="price-list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gray-900/50 rounded-2xl border border-orange-500/20 p-6"
              >
                <PriceListViewer />
              </motion.div>
            )}

            {/* ── Clientes ── */}
            {activeTab === "clients" && (
              <motion.div
                key="clients"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ClientsList />
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}