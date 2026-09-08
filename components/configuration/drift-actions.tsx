"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function DriftActions({ id, platform }: { id: string; platform: string }) {
  const router = useRouter();

  async function act(action: "review" | "approve" | "remediate") {
    try {
      if (action === "remediate") {
        if (!confirm("Restore this setting to the approved baseline?")) return;
        await api(`/api/configuration/${platform}/remediate`, { method: "POST", body: JSON.stringify({ driftId: id }) });
      } else {
        await api(`/api/configuration/drifts/${id}`, { method: "POST", body: JSON.stringify({ action }) });
      }
      toast.success(action === "remediate" ? "Baseline restored" : "Drift updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  }

  return (
    <div className="mt-3 flex gap-2">
      <Button size="sm" variant="secondary" onClick={() => act("review")}>Review</Button>
      <Button size="sm" variant="secondary" onClick={() => act("approve")}>Approve</Button>
      <Button size="sm" onClick={() => act("remediate")}>Remediate</Button>
    </div>
  );
}

export function ChangeActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();

  async function act(action: "approve" | "reject" | "execute") {
    if (action === "reject" && !confirm("Reject this change request?")) return;
    try {
      await api(`/api/changes/${id}`, { method: "POST", body: JSON.stringify({ action }) });
      toast.success("Change updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  }

  return (
    <div className="mt-5 flex gap-2">
      {status === "PENDING_APPROVAL" ? (
        <>
          <Button size="sm" onClick={() => act("approve")}>Approve</Button>
          <Button size="sm" variant="secondary" onClick={() => act("reject")}>Reject</Button>
        </>
      ) : null}
      {status === "APPROVED" ? <Button size="sm" onClick={() => act("execute")}>Execute change</Button> : null}
    </div>
  );
}
