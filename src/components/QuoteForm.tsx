// components/dashboard/QuoteForm.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

interface QuoteFormProps {
  onQuoteCreated: () => void;
}

export function QuoteForm({ onQuoteCreated }: QuoteFormProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    amount: '',
    description: '',
    valid_until: ''
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const quoteNumber = `COT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    const { error } = await supabase.from('quotes').insert({
      quote_number: quoteNumber,
      client_name: formData.client_name,
      client_email: formData.client_email,
      client_phone: formData.client_phone,
      amount: parseFloat(formData.amount),
      description: formData.description,
      valid_until: formData.valid_until,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error('Error creating quote:', error);
      alert('Error al crear la cotización');
    } else {
      alert('Cotización creada exitosamente');
      onQuoteCreated();
      setFormData({
        client_name: '',
        client_email: '',
        client_phone: '',
        amount: '',
        description: '',
        valid_until: ''
      });
    }
    setLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-orange-500/20 p-6"
    >
      <h2 className="text-xl font-bold text-white mb-6">Nueva Cotización</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Nombre del Cliente *
            </label>
            <input
              type="text"
              required
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              className="w-full bg-black/50 border border-orange-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Email del Cliente *
            </label>
            <input
              type="email"
              required
              value={formData.client_email}
              onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
              className="w-full bg-black/50 border border-orange-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="cliente@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={formData.client_phone}
              onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
              className="w-full bg-black/50 border border-orange-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="+56 9 1234 5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Monto *
            </label>
            <input
              type="number"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full bg-black/50 border border-orange-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="1000000"
              step="1000"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Descripción del Servicio/Producto *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-black/50 border border-orange-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
              placeholder="Detalle de los servicios o productos cotizados..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Válido hasta
            </label>
            <input
              type="date"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              className="w-full bg-black/50 border border-orange-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-2 border border-orange-500/30 rounded-lg text-gray-400 hover:text-white hover:border-orange-500 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Cotización'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}