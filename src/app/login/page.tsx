"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const reduceMotion = useReducedMotion();
  const ambient = !reduceMotion;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos"
          : error.message
      );
      setLoading(false);
      return;
    }

    // Best-effort audit write — not a security control (the client could
    // skip it), just an admin-visible trail. See the port plan's note on
    // why this can't be purely server-authoritative like the PHP original.
    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("nombre").eq("id", data.user.id).single();
      await supabase.from("audit_log").insert({
        tipo: "sesion",
        usuario_id: data.user.id,
        usuario_nombre: profile?.nombre ?? data.user.email,
        accion: "login",
      });
    }

    // Brief success beat so the checkmark is actually seen before the route
    // changes, instead of the button flashing and the page ripping away.
    setSuccess(true);
    await new Promise((resolve) => setTimeout(resolve, 550));

    router.push("/dashboard");
    router.refresh();
  }

  if (!isMounted) return null;

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: "radial-gradient(120% 140% at 15% 0%, #2b120a 0%, #170907 45%, #0b0503 100%)" }}
    >
      {/* Brasas difuminadas -- ambient ember glow, drifts and breathes; frozen under reduced-motion */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: 380, height: 380, left: -100, top: -60, background: "radial-gradient(circle, rgba(255,138,61,0.35), transparent 70%)", filter: "blur(70px)" }}
        animate={ambient ? { x: [0, 40, 0], y: [0, 30, 0], opacity: [0.75, 1, 0.75] } : undefined}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: 420, height: 420, right: -140, bottom: -100, background: "radial-gradient(circle, rgba(255,65,54,0.28), transparent 70%)", filter: "blur(70px)" }}
        animate={ambient ? { x: [0, -30, 0], y: [0, -40, 0], opacity: [0.7, 1, 0.7] } : undefined}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ width: 260, height: 260, right: "15%", top: "8%", background: "radial-gradient(circle, rgba(255,199,118,0.18), transparent 70%)", filter: "blur(70px)" }}
      />

      <div className="relative w-full max-w-[420px]">
        {/* Logo y título */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-7"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="relative inline-flex items-center justify-center mb-5"
          >
            {ambient && (
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: 90,
                  height: 90,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "radial-gradient(circle, rgba(255,138,61,0.55), transparent 70%)",
                  filter: "blur(14px)",
                }}
                animate={{ scale: [1, 1.18, 1], opacity: [0.5, 0.85, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
            <img
              src="/logo-icon.png"
              alt="Fortress8"
              className="relative w-16 h-16 object-contain"
              style={{ filter: "drop-shadow(0 6px 18px rgba(255,90,40,0.45))" }}
            />
          </motion.div>

          <p className="font-serif italic text-[15px] mb-1" style={{ color: "#e8b48f" }}>
            Bienvenido de vuelta
          </p>
          <h1 className="font-serif text-[32px] font-medium tracking-tight" style={{ color: "#fbefe4" }}>
            Fortress8
          </h1>
          <p className="text-xs tracking-[0.08em] mt-2" style={{ color: "#c9a98f" }}>
            SISTEMA DE COTIZACIONES
          </p>
        </motion.div>

        {/* Tarjeta de vidrio */}
        <div className="relative">
          {ambient && (
            <motion.div
              className="absolute -inset-[3px] rounded-[24px] pointer-events-none"
              style={{
                background: "linear-gradient(135deg, rgba(255,138,61,.4), transparent 40%, transparent 60%, rgba(239,65,54,.35))",
                filter: "blur(7px)",
              }}
              animate={{ opacity: [0.35, 0.7, 0.35] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative rounded-[22px] p-7"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.02))",
              border: "1px solid rgba(255,180,130,0.16)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 20px 60px -20px rgba(0,0,0,0.6)",
            }}
          >
            <form onSubmit={handleLogin} className="space-y-[18px]">
              {/* Campo email */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                <label className="block text-[12.5px] font-semibold mb-[7px]" style={{ color: "#e3c3ac" }}>
                  Correo electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@fortress8.com"
                  className="w-full rounded-xl px-3.5 py-3 text-sm outline-none transition-all duration-200 border bg-black/[0.22] border-[rgba(255,180,130,0.18)] placeholder:text-[#7a6355] focus:border-[#ff8a3d] focus:bg-black/30 focus:shadow-[0_0_0_4px_rgba(255,138,61,0.15)]"
                  style={{ color: "#fbefe4" }}
                />
              </motion.div>

              {/* Campo password */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.32 }}>
                <label className="block text-[12.5px] font-semibold mb-[7px]" style={{ color: "#e3c3ac" }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl px-3.5 py-3 text-sm outline-none transition-all duration-200 border bg-black/[0.22] border-[rgba(255,180,130,0.18)] placeholder:text-[#7a6355] focus:border-[#ff8a3d] focus:bg-black/30 focus:shadow-[0_0_0_4px_rgba(255,138,61,0.15)]"
                  style={{ color: "#fbefe4" }}
                />
              </motion.div>

              <div className="flex justify-end -mt-2">
                <button type="button" className="text-xs hover:underline" style={{ color: "#e8b48f" }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0, x: [0, -6, 6, -4, 4, 0] }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3"
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
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative overflow-hidden w-full rounded-xl py-3.5 font-semibold text-sm flex items-center justify-center gap-2"
                style={{
                  color: "#2a0e04",
                  background: "linear-gradient(135deg, #ffb066, #ff7a3d 50%, #ef4136)",
                  boxShadow: "0 10px 30px -8px rgba(255,90,40,0.55)",
                }}
              >
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"
                  style={{ background: "linear-gradient(120deg, transparent, rgba(255,255,255,.4), transparent)" }}
                />
                <AnimatePresence mode="wait" initial={false}>
                  {success ? (
                    <motion.span
                      key="success"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="relative flex items-center justify-center gap-2"
                    >
                      <motion.svg
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                      </motion.svg>
                      <span>¡Acceso concedido!</span>
                    </motion.span>
                  ) : loading ? (
                    <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Verificando acceso...</span>
                    </motion.span>
                  ) : (
                    <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative">
                      Iniciar sesión
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-6 text-[12.5px]"
          style={{ color: "#9c8271" }}
        >
          ¿Problemas para acceder?{" "}
          <button className="font-semibold" style={{ color: "#ffb066" }}>
            Contactar soporte →
          </button>
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-6 text-[11.5px]"
          style={{ color: "#6b5344" }}
        >
          © {new Date().getFullYear()} FORTRESS8 — Sistema de Cotizaciones Profesional
        </motion.p>
      </div>
    </div>
  );
}
