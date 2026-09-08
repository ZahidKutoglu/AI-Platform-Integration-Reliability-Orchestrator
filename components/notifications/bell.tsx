"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import { relativeTime } from "@/lib/utils";

type Notification = {
  id: string;
  title: string;
  message: string;
  kind: string;
  read: boolean;
  muted: boolean;
  href: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  async function load() {
    const data = await api<{ notifications: Notification[] }>("/api/notifications");
    setItems(data.notifications.filter((n) => !n.muted));
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  async function mark(id: string, patch: Partial<Notification>) {
    await api(`/api/notifications/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    await load();
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className="relative rounded-full p-2 text-muted hover:bg-black/[0.04] hover:text-ink"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="size-4" />
        {unread ? <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-down" /> : null}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-line animate-fade-up">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-[13px] font-medium">Notifications</p>
            <span className="text-[12px] text-faint">{unread} unread</span>
          </div>
          <ul className="max-h-[420px] divide-y divide-line overflow-auto">
            {items.length === 0 ? (
              <li className="px-4 py-8 text-[14px] text-muted">You are caught up.</li>
            ) : (
              items.map((item) => (
                <li key={item.id} className="px-4 py-3">
                  <p className="text-[14px] font-medium">{item.title}</p>
                  <p className="mt-1 text-[13px] text-muted">{item.message}</p>
                  <div className="mt-2 flex items-center gap-3 text-[12px] text-faint">
                    <span>{relativeTime(item.createdAt)}</span>
                    {item.href ? (
                      <Link href={item.href} className="text-ink" onClick={() => setOpen(false)}>
                        View
                      </Link>
                    ) : null}
                    {!item.read ? (
                      <button type="button" onClick={() => mark(item.id, { read: true })}>
                        Mark read
                      </button>
                    ) : null}
                    <button type="button" onClick={() => mark(item.id, { muted: true })}>
                      Mute
                    </button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
