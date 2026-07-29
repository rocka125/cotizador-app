"use client";

import { IconUser } from "@tabler/icons-react";
import { NotificationBell } from "./NotificationBell";

export function Topbar({
  title,
  userEmail,
  userInitials,
}: {
  title: string;
  userEmail: string;
  userInitials: string;
}) {
  return (
    <header
      className="flex items-center justify-between px-5 border-b"
      style={{
        height: 54,
        gridColumn: "2 / -1",
        background: "rgba(0,0,0,0.4)",
        borderColor: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      <h1 className="text-sm font-semibold text-white tracking-wide">{title}</h1>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div
          className="flex items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{
            width: 30,
            height: 30,
            background: "var(--shell-accent, #F57B02)",
          }}
          title={userEmail}
        >
          {userInitials || <IconUser size={16} />}
        </div>
      </div>
    </header>
  );
}
