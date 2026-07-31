"use client";

// Browser Notification API wrapper -- shows an OS-level toast while the app
// is open in some tab, even if that tab is backgrounded/minimized. This is
// NOT Web Push: it can't fire with the browser fully closed (that needs a
// service worker + VAPID keys + a push_subscriptions table + a server-side
// send step, like the old PHP app's push_helper.php/push-client.js). Kept
// deliberately simpler since that's the level the user actually asked for.

export type DesktopPermission = "default" | "granted" | "denied" | "unsupported";

function hasNotificationApi(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getDesktopPermission(): DesktopPermission {
  if (!hasNotificationApi()) return "unsupported";
  return Notification.permission;
}

// Must be called from a user gesture (click handler) -- browsers ignore or
// block the prompt otherwise.
export async function requestDesktopPermission(): Promise<DesktopPermission> {
  if (!hasNotificationApi()) return "unsupported";
  return Notification.requestPermission();
}

const TIPO_TITLES: Record<string, string> = {
  creacion: "🆕 Nueva cotización",
  edicion: "✏️ Cotización editada",
  eliminacion: "🗑️ Cotización eliminada",
  estado: "✅ Cambio de estado",
  email_abierto: "👁️ Correo abierto",
  nota_ajena: "📝 Nueva nota",
  urgente: "⏰ Cotización urgente",
  vigencia: "📅 Cotización por vencer",
};

export function showDesktopNotification(params: { tipo: string | null; mensaje: string; onClick?: () => void }) {
  if (!hasNotificationApi() || Notification.permission !== "granted") return;
  // The in-app bell (badge + sound) already covers the case where the user
  // is actively looking at the tab -- an OS toast on top of that would just
  // be redundant. Only pop one when the tab isn't the one they're looking at.
  if (document.visibilityState === "visible" && document.hasFocus()) return;

  try {
    const title = (params.tipo && TIPO_TITLES[params.tipo]) || "Fortress8 Cotizador";
    const n = new Notification(title, {
      body: params.mensaje,
      icon: "/logo-icon.png",
      tag: params.tipo ?? undefined,
    });
    n.onclick = () => {
      window.focus();
      params.onClick?.();
      n.close();
    };
  } catch {
    // Some browsers throw if permission changed between the check above and
    // the constructor call (e.g. revoked mid-session) -- never let a
    // notification failure break the rest of the bell.
  }
}
