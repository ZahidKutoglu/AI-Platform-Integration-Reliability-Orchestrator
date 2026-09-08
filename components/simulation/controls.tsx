"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

const scenarios = [
  { kind: "claude_outage", title: "Simulate Claude outage", detail: "Error rate 0.2% → 18%. Status becomes Degraded. Incident and remediation run." },
  { kind: "n8n_workflow_failure", title: "Simulate workflow failure", detail: "A failed n8n execution is ingested, retried, and tracked." },
  { kind: "chatgpt_latency", title: "Simulate ChatGPT latency spike", detail: "Latency moves above the SLO and opens a degradation incident." },
  { kind: "webhook_failure", title: "Simulate webhook failure", detail: "Inbound webhook delivery fails and the connector reconnects." },
  { kind: "configuration_drift", title: "Simulate configuration drift", detail: "External sharing flips to Enabled against the approved baseline." },
  { kind: "identity_sync_failure", title: "Simulate identity sync failure", detail: "Entra SCIM synchronization fails and the identity integration degrades." },
  { kind: "vendor_outage", title: "Simulate vendor outage", detail: "Replit moves to Outage and a vendor escalation is drafted." },
];

export function SimulationControls() {
  const router = useRouter();

  async function run(kind: string, label: string) {
    const id = toast.loading(label);
    try {
      if (kind === "recovery") await api("/api/simulation/recovery", { method: "POST" });
      else if (kind === "reset") await api("/api/simulation/reset", { method: "POST" });
      else await api("/api/simulation/outage", { method: "POST", body: JSON.stringify({ kind }) });
      toast.success("State updated", { id });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Simulation failed", { id });
    }
  }

  return (
    <div className="grid gap-4">
      {scenarios.map((scenario) => (
        <Card key={scenario.kind} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-[18px] font-semibold tracking-[-0.02em]">{scenario.title}</h3>
            <p className="mt-1 max-w-2xl text-[14px] text-muted">{scenario.detail}</p>
          </div>
          <Button onClick={() => run(scenario.kind, scenario.title)}>Run</Button>
        </Card>
      ))}
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => run("recovery", "Simulating recovery")}>Simulate recovery</Button>
        <Button variant="quiet" onClick={() => run("reset", "Resetting environment")}>Reset environment</Button>
      </div>
    </div>
  );
}
