"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

const options = [
  { slug: "chatgpt", name: "ChatGPT Enterprise" },
  { slug: "claude", name: "Claude" },
  { slug: "replit", name: "Replit" },
  { slug: "n8n", name: "n8n" },
  { slug: "entra", name: "Identity Provider" },
  { slug: "servicenow", name: "ServiceNow" },
  { slug: "slack", name: "Slack" },
];

export default function ConnectIntegrationPage() {
  const [slug, setSlug] = useState("slack");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function connect() {
    setBusy(true);
    try {
      await api(`/api/integrations/${slug}?action=connect`, { method: "POST" });
      toast.success(`${options.find((o) => o.slug === slug)?.name} connected`);
      router.push(`/integrations/${slug}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not connect");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Connect integration"
        description="Connect a platform, identity, ticketing, or notification system using the shared connector interface."
      />
      <Card className="max-w-xl">
        <label className="text-[13px] text-faint" htmlFor="integration">
          Integration
        </label>
        <select
          id="integration"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          className="mt-2 h-12 w-full rounded-2xl bg-canvas px-4 text-[15px] outline-none ring-1 ring-line"
        >
          {options.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.name}
            </option>
          ))}
        </select>
        <Button className="mt-6" onClick={connect} disabled={busy}>
          {busy ? "Connecting…" : "Connect"}
        </Button>
      </Card>
    </div>
  );
}
