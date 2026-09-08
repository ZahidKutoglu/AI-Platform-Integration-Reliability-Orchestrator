"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { api } from "@/lib/api";

type SearchResult = {
  platforms: Array<{ slug: string; name: string }>;
  incidents: Array<{ id: string; number: string; title: string }>;
  workflows: Array<{ slug: string; name: string; platform?: { slug: string } }>;
  integrations: Array<{ slug: string; name: string }>;
  events: Array<{ id: string; title: string; type: string }>;
  changes: Array<{ id: string; number: string; title: string }>;
  runbooks: Array<{ slug: string; title: string }>;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((v) => !v);
      }
      if (event.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("ops:search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("ops:search", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const handle = setTimeout(() => {
      api<SearchResult>(`/api/search?q=${encodeURIComponent(query)}`)
        .then(setResults)
        .catch(() => setResults({ platforms: [], incidents: [], workflows: [], integrations: [], events: [], changes: [], runbooks: [] }))
        .finally(() => setLoading(false));
    }, 120);
    return () => clearTimeout(handle);
  }, [query, open]);

  const empty = useMemo(() => {
    if (!results) return true;
    return Object.values(results).every((list) => list.length === 0);
  }, [results]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 px-4 pt-[18vh] backdrop-blur-[2px]">
      <button className="absolute inset-0 cursor-default" aria-label="Close search" onClick={() => setOpen(false)} />
      <Command className="relative w-full max-w-xl overflow-hidden rounded-[24px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] ring-1 ring-line animate-fade-up" loop>
        <Command.Input
          autoFocus
          value={query}
          onValueChange={setQuery}
          placeholder="Search platforms, incidents, workflows…"
          className="h-14 w-full border-b border-line px-5 text-[16px] outline-none placeholder:text-faint"
        />
        <Command.List className="max-h-[420px] overflow-auto p-2">
          <Command.Empty className="px-3 py-8 text-center text-[14px] text-muted">
            {loading || results === null ? "Searching…" : "No matching operational records."}
          </Command.Empty>
          {empty && !loading ? null : (
            <>
              <Group heading="Platforms" items={results?.platforms ?? []} onSelect={(item) => go(`/platforms/${item.slug}`)} label={(i) => i.name} />
              <Group heading="Incidents" items={results?.incidents ?? []} onSelect={(item) => go(`/incidents/${item.id}`)} label={(i) => `${i.number} · ${i.title}`} />
              <Group heading="Workflows" items={results?.workflows ?? []} onSelect={(item) => go(item.platform ? `/platforms/${item.platform.slug}` : "/automations")} label={(i) => i.name} />
              <Group heading="Integrations" items={results?.integrations ?? []} onSelect={(item) => go(`/integrations/${item.slug}`)} label={(i) => i.name} />
              <Group heading="Events" items={results?.events ?? []} onSelect={() => go("/activity")} label={(i) => i.title} />
              <Group heading="Changes" items={results?.changes ?? []} onSelect={() => go("/configuration")} label={(i) => `${i.number} · ${i.title}`} />
              <Group heading="Runbooks" items={results?.runbooks ?? []} onSelect={(item) => go(`/runbooks/${item.slug}`)} label={(i) => i.title} />
            </>
          )}
        </Command.List>
      </Command>
    </div>
  );
}

function Group<T extends object>({
  heading,
  items,
  onSelect,
  label,
}: {
  heading: string;
  items: T[];
  onSelect: (item: T) => void;
  label: (item: T) => string;
}) {
  if (!items.length) return null;
  return (
    <Command.Group heading={heading} className="px-1 py-2 text-[12px] text-faint">
      {items.map((item, index) => (
        <Command.Item
          key={index}
          value={`${heading}-${label(item)}`}
          onSelect={() => onSelect(item)}
          className="cursor-pointer rounded-xl px-3 py-2 text-[14px] text-ink aria-selected:bg-black/[0.04]"
        >
          {label(item)}
        </Command.Item>
      ))}
    </Command.Group>
  );
}
