// components/dashboard/StatsCards.tsx
"use client";

import { motion } from "framer-motion";

interface StatsCardsProps {
  stats: {
    totalQuotes: number;
    totalAmount: number;
    pendingQuotes: number;
    approvedQuotes: number;
  };
}

const cards = [
  {
    title: "Total Cotizaciones",
    value: (stats: any) => stats.totalQuotes,
    icon: "📋",
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10"
  },
  {
    title: "Monto Total",
    value: (stats: any) => `$${stats.totalAmount.toLocaleString()}`,
    icon: "💰",
    color: "from-green-500 to-green-600",
    bgColor: "bg-green-500/10"
  },
  {
    title: "Cotizaciones Pendientes",
    value: (stats: any) => stats.pendingQuotes,
    icon: "⏳",
    color: "from-yellow-500 to-yellow-600",
    bgColor: "bg-yellow-500/10"
  },
  {
    title: "Cotizaciones Aprobadas",
    value: (stats: any) => stats.approvedQuotes,
    icon: "✅",
    color: "from-purple-500 to-purple-600",
    bgColor: "bg-purple-500/10"
  }
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-orange-500/20 p-6 hover:border-orange-500/40 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">{card.title}</p>
              <p className="text-2xl font-bold text-white">
                {card.value(stats)}
              </p>
            </div>
            <div className={`w-12 h-12 ${card.bgColor} rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
              {card.icon}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}