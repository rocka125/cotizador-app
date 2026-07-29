"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

// Partículas generadas fuera del componente para evitar window en SSR
const PARTICLES = [...Array(20)].map((_, i) => ({
  id: i,
  initialX: Math.random() * 1400,
  initialY: Math.random() * 900,
  animX: [Math.random() * 1400, Math.random() * 1400, Math.random() * 1400],
  animY: [Math.random() * 900, Math.random() * 900, Math.random() * 900],
  duration: 20 + Math.random() * 10,
}));

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos"
          : error.message
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (!isMounted) return null;

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Fondo animado con gradientes */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#1a0a00] to-black" />

      {/* Efecto de grid con movimiento */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #ff6b00 1px, transparent 1px),
            linear-gradient(to bottom, #ff6b00 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`,
        }}
      />

      {/* Partículas dinámicas — valores fijos, sin window */}
      <div className="absolute inset-0 overflow-hidden">
        {PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute w-1 h-1 bg-orange-500/20 rounded-full"
            initial={{ x: p.initialX, y: p.initialY }}
            animate={{ x: p.animX, y: p.animY }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Glow orbs animados */}
      <motion.div
        className="absolute top-1/4 -left-48 w-96 h-96 rounded-full bg-orange-600/20 blur-[100px]"
        animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-48 w-96 h-96 rounded-full bg-orange-500/20 blur-[100px]"
        animate={{ x: [0, -100, 0], y: [0, 50, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Contenido principal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-[440px]">
          {/* Logo y título */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="inline-flex items-center justify-center mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500 rounded-2xl blur-xl opacity-50" />
                <div className="relative bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl p-4 shadow-2xl">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-orange-200 to-white bg-clip-text text-transparent">
              Fortress8
            </h1>
            <p className="text-orange-500/60 mt-3 text-sm font-medium tracking-wide">
              SISTEMA DE COTIZACIONES
            </p>
          </motion.div>

          {/* Tarjeta de login */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            {/* Borde con glow animado */}
            <motion.div
              className="absolute -inset-[1px] bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 rounded-2xl"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative bg-gradient-to-br from-gray-900/90 via-gray-900 to-black/90 backdrop-blur-xl rounded-2xl border border-orange-500/20 shadow-2xl p-8">
              {/* Indicador de seguridad */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-orange-500/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-500 font-mono">SECURE CONNECTION</span>
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="text-orange-500/40 text-xs"
                >
                  ● ● ●
                </motion.div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Campo email */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <label className="block text-xs font-mono font-semibold text-orange-400 uppercase tracking-wider mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-orange-500/40 group-focus-within:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@fortress8.com"
                      className="w-full bg-black/50 border border-orange-500/20 rounded-lg pl-10 pr-4 py-3
                                 text-white text-sm placeholder:text-gray-600
                                 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50
                                 transition-all duration-300"
                    />
                  </div>
                </motion.div>

                {/* Campo password */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <label className="block text-xs font-mono font-semibold text-orange-400 uppercase tracking-wider mb-2">
                    Contraseña
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-orange-500/40 group-focus-within:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-black/50 border border-orange-500/20 rounded-lg pl-10 pr-4 py-3
                                 text-white text-sm placeholder:text-gray-600
                                 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50
                                 transition-all duration-300"
                    />
                  </div>
                </motion.div>

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3"
                    >
                      <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={1.5} />
                        <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth={1.5} />
                        <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth={1.5} />
                      </svg>
                      <span className="text-sm text-red-400">{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botón login */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative w-full group overflow-hidden rounded-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-500 opacity-90" />
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),rgba(255,255,255,0))]" />

                    <div className="relative flex items-center justify-center gap-2 py-3.5 px-4 font-semibold text-white">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span>Verificando acceso...</span>
                        </>
                      ) : (
                        <>
                          <span>Iniciar sesión</span>
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </div>
                  </motion.button>
                </motion.div>
              </form>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 pt-4 border-t border-orange-500/10"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">¿Problemas para acceder?</span>
                  <button className="text-orange-400 hover:text-orange-300 transition-colors font-mono">
                    Contactar soporte →
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Footer text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-xs text-gray-600 mt-8 font-mono"
          >
            © {new Date().getFullYear()} FORTRESS8 — Sistema de Cotizaciones Profesional
          </motion.p>
        </div>
      </div>
    </div>
  );
}