"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { IconBell, IconVolume, IconVolumeOff } from "@tabler/icons-react";
import { playNotifSound, isSoundEnabled, setSoundEnabled } from "@/lib/notifSound";

interface Notification {
  id: string;
  quote_id: string | null;
  mensaje: string;
  leido: boolean;
  tipo: string | null;
  created_at: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundOn, setSoundOn] = useState(true);

  // null until the first fetch primes it -- prevents playing a sound for
  // every already-unread notification the moment the app loads, since only
  // ids that show up in a LATER poll (i.e. genuinely new) should play one.
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  }

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const body = await res.json();
      const list: Notification[] = body.notifications ?? [];

      if (seenIds.current === null) {
        seenIds.current = new Set(list.map((n) => n.id));
      } else {
        const arrived = list.filter((n) => !n.leido && !seenIds.current!.has(n.id));
        for (const n of arrived) playNotifSound(n.tipo);
        seenIds.current = new Set(list.map((n) => n.id));
      }

      setNotifications(list);
      setUnreadCount(body.unreadCount ?? 0);
    } catch {
      // silent — notification polling shouldn't surface errors to the user
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function handleOpen() {
    setOpen((v) => !v);
    if (!open) await fetchNotifications();
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "marcar_todas" }),
    });
    fetchNotifications();
  }

  async function handleClickNotification(n: Notification) {
    if (!n.leido) {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "marcar_leida", id: n.id }),
      });
      fetchNotifications();
    }
    setOpen(false);
    if (n.quote_id) router.push(`/cotizaciones/${n.quote_id}/ver`);
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative flex items-center justify-center w-8 h-8 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        <IconBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-80 max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-gray-900 shadow-2xl z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-sm font-semibold text-white">Notificaciones</span>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-[var(--shell-accent)] hover:underline">
                    Marcar todas
                  </button>
                )}
                <button
                  onClick={toggleSound}
                  title={soundOn ? "Silenciar sonidos" : "Activar sonidos"}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  {soundOn ? <IconVolume size={15} /> : <IconVolumeOff size={15} />}
                </button>
              </div>
            </div>
            {notifications.length === 0 && <p className="text-center text-white/30 text-sm py-8">Sin notificaciones.</p>}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className="w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors"
                style={{ background: n.leido ? "transparent" : "rgba(245,123,2,0.06)" }}
              >
                <p className="text-xs text-white/80">{n.mensaje}</p>
                <p className="text-[10px] text-white/30 mt-1">{new Date(n.created_at).toLocaleString("es-MX")}</p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
