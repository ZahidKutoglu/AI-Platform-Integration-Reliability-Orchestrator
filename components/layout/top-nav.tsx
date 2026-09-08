"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/bell";
import { Logo } from "@/components/layout/logo";

const links = [
  { href: "/", label: "Overview" },
  { href: "/platforms", label: "Platforms" },
  { href: "/automations", label: "Automations" },
  { href: "/incidents", label: "Incidents" },
  { href: "/integrations", label: "Integrations" },
  { href: "/configuration", label: "Configuration" },
  { href: "/runbooks", label: "Runbooks" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-[58px] max-w-[1180px] items-center gap-6 px-6 md:px-10">
        <Logo />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {links.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[13px] font-medium transition",
                  active ? "bg-black/[0.05] text-ink" : "text-muted hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("ops:search"))}
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] text-muted hover:bg-black/[0.04] hover:text-ink"
            aria-label="Open search"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden rounded-md bg-black/[0.04] px-1.5 py-0.5 text-[11px] text-faint md:inline">⌘K</kbd>
          </button>
          <NotificationBell />
          <Link
            href="/simulation"
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-muted hover:text-ink"
          >
            Admin
          </Link>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 lg:hidden" aria-label="Mobile">
        {links.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1 text-[13px]",
                active ? "bg-black/[0.05] text-ink" : "text-muted",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
