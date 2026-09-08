import { z } from "zod";
import { handleRoute } from "@/lib/http";
import { runSimulation, type SimulationKind } from "@/lib/simulation/engine";
import { getOperatorSession, assertRole } from "@/lib/auth";

const schema = z.object({
  kind: z
    .enum([
      "claude_outage",
      "n8n_workflow_failure",
      "chatgpt_latency",
      "webhook_failure",
      "configuration_drift",
      "identity_sync_failure",
      "vendor_outage",
    ])
    .default("claude_outage"),
});

export async function POST(request: Request) {
  return handleRoute(request, async () => {
    const session = await getOperatorSession();
    assertRole(session, ["ADMIN", "OPERATOR"]);
    const body = schema.parse(await request.json().catch(() => ({})));
    return runSimulation(body.kind as SimulationKind);
  });
}
