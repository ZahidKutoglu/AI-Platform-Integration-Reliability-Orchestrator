"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";

export function DemoBanner() {
  const router = useRouter();

  async function run(kind: string, label: string) {
    const toastId = toast.loading(label);
    try {
      if (kind === "reset") await api("/api/simulation/reset", { method: "POST" });
      else if (kind === "recovery") await api("/api/simulation/recovery", { method: "POST" });
      else await api("/api/simulation/outage", { method: "POST", body: JSON.stringify({ kind }) });
      toast.success("Environment updated", { id: toastId });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Simulation failed", { id: toastId });
    }
  }

  return (
    <div className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-end gap-x-4 gap-y-2 px-6 py-2.5 text-[12px] text-muted md:px-10">
        <button type="button" className="hover:text-ink" onClick={() => run("claude_outage", "Simulating Claude outage")}>
          Simulate outage
        </button>
        <button type="button" className="hover:text-ink" onClick={() => run("n8n_workflow_failure", "Simulating workflow failure")}>
          Simulate workflow failure
        </button>
        <button type="button" className="hover:text-ink" onClick={() => run("configuration_drift", "Simulating configuration drift")}>
          Simulate configuration drift
        </button>
        <button type="button" className="hover:text-ink" onClick={() => run("recovery", "Simulating recovery")}>
          Simulate recovery
        </button>
        <button type="button" className="font-medium text-ink" onClick={() => run("reset", "Resetting environment")}>
          Reset
        </button>
      </div>
    </div>
  );
}
