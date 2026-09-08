"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function IncidentActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function transition(signal: "ack" | "mitigate" | "monitor" | "resolve", message: string) {
    setBusy(true);
    try {
      await api(`/api/incidents/${id}/transition`, { method: "POST", body: JSON.stringify({ signal, message }) });
      toast.success("Incident updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function escalate() {
    setBusy(true);
    try {
      const data = await api<{ escalation: { number: string }; package: unknown }>(`/api/incidents/${id}/escalate`, { method: "POST" });
      const blob = new Blob([JSON.stringify(data.package, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data.escalation.number}.json`;
      a.click();
      toast.success(`Escalation ${data.escalation.number} generated`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Escalation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "RESOLVED" ? (
        <>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => transition("ack", "Operator acknowledged the incident.")}>
            Investigate
          </Button>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => transition("mitigate", "Operator started mitigation.")}>
            Mitigate
          </Button>
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => transition("monitor", "Monitoring recovery.")}>
            Monitor
          </Button>
          <Button size="sm" disabled={busy} onClick={() => transition("resolve", "Operator confirmed recovery.")}>
            Resolve
          </Button>
        </>
      ) : null}
      <Button variant="quiet" size="sm" disabled={busy} onClick={escalate}>
        Escalate to vendor
      </Button>
    </div>
  );
}
