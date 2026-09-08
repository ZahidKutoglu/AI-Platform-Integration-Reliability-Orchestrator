"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function ExecuteWorkflowButton({ slug }: { slug: string }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function run() {
    setBusy(true);
    try {
      await api(`/api/workflows/${slug}/execute`, { method: "POST" });
      toast.success("Workflow executed");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Execution failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={run} disabled={busy}>
      {busy ? "Running…" : "Run workflow"}
    </Button>
  );
}
