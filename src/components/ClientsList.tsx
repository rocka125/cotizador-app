// components/dashboard/ClientsList.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_quotes: number;
  total_spent: number;
}

export function ClientsList() {
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    const { data, error } = await supabase
      .from('quotes')
      .select('client_name, client_email, client_phone, amount')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      setLoading(false);
      return;
    }

    // Aggregate client data
    const clientMap = new Map();
    data?.forEach(quote => {
      const key = quote.client_email;
      if (!clientMap.has(key)) {
        clientMap.set(key, {
          id: key,
          name: quote.client_name,
          email: quote.client_email,
          phone: quote.client_phone || '',
          total_quotes: 1,
          total_spent: quote.amount
        });
      } else {
        const client = clientMap.get(key);
        client.total_quotes++;
        client.total_spent += quote.amount;
      }
    });

    setClients(Array.from(clientMap.values()));
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="bg-gray-900/50 rounded-2xl border border-orange-500/20 p-6">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-orange-500/20 p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Clientes</h2>
        <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white text-sm font-medium transition-colors">
          + Agregar Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client, index) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gray-800/30 rounded-xl p-4 hover:bg-gray-800/50 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-medium">{client.name}</h3>
                <p className="text-gray-400 text-sm">{client.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                {client.name.charAt(0).toUpperCase()}
              </div>
            </div>
            
            {client.phone && (
              <p className="text-gray-400 text-sm mb-2">📱 {client.phone}</p>
            )}
            
            <div className="flex justify-between items-center pt-3 border-t border-orange-500/10">
              <div>
                <p className="text-xs text-gray-500">Cotizaciones</p>
                <p className="text-white font-medium">{client.total_quotes}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total gastado</p>
                <p className="text-orange-400 font-medium">${client.total_spent.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {clients.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No hay clientes registrados</p>
          <button className="mt-2 text-orange-400 text-sm">Agregar primer cliente</button>
        </div>
      )}
    </motion.div>
  );
}