"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function IntegrationActions({ slug, status }: { slug: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function act(action: "test" | "connect" | "disconnect") {
    if (action === "disconnect" && !confirm("Disconnect this integration? Inbound events will stop until it is reconnected.")) {
      return;
    }
    setBusy(true);
    try {
      await api(`/api/integrations/${slug}?action=${action}`, { method: "POST" });
      toast.success(action === "test" ? "Connection tested" : action === "connect" ? "Connected" : "Disconnected");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => act("test")} disabled={busy}>
        Test connection
      </Button>
      {status === "DISCONNECTED" ? (
        <Button size="sm" variant="secondary" onClick={() => act("connect")} disabled={busy}>
          Connect integration
        </Button>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => act("disconnect")} disabled={busy}>
          Disconnect
        </Button>
      )}
    </div>
  );
}
