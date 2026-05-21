// components/dashboard/RecentQuotes.tsx
"use client";

import { motion } from "framer-motion";

interface RecentQuotesProps {
  quotes: any[];
}

export function RecentQuotes({ quotes }: RecentQuotesProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-orange-500/20 p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Cotizaciones Recientes</h2>
        <button className="text-orange-400 hover:text-orange-300 text-sm transition-colors">
          Ver todas →
        </button>
      </div>

      <div className="space-y-4">
        {quotes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No hay cotizaciones aún</p>
            <button 
            className="mt-2 text-orange-400 text-sm">Crear primera cotización</button>
          </div>
        ) : (
          quotes.map((quote, index) => (
            <motion.div
              key={quote.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-sm text-orange-400">#{quote.quote_number}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    quote.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                    quote.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    quote.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {quote.status === 'approved' ? 'Aprobada' :
                     quote.status === 'pending' ? 'Pendiente' :
                     quote.status === 'rejected' ? 'Rechazada' : 'Enviada'}
                  </span>
                </div>
                <p className="text-white font-medium">{quote.client_name}</p>
                <p className="text-gray-400 text-sm">
                  {new Date(quote.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white font-bold">${quote.amount.toLocaleString()}</p>
                <button className="text-orange-400 text-xs hover:text-orange-300 mt-1">
                  Ver detalles
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}