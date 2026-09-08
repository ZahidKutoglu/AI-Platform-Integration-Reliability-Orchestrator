import { prisma } from "@/lib/db";
import { ApiError, handleRoute } from "@/lib/http";
import { getConnector } from "@/lib/connectors/registry";
import { ingestEvent } from "@/lib/events/engine";
import { getOperatorSession } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return handleRoute(request, async () => {
    const workflow = await prisma.workflow.findUnique({
      where: { slug },
      include: { platform: true },
    });
    if (!workflow) throw new ApiError("Workflow not found.", 404);
    const session = await getOperatorSession();
    const result = await getConnector(workflow.platform.slug).executeAction({
      type: "restart_workflow",
      workflowSlug: workflow.slug,
    });
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId: workflow.id,
        status: result.ok ? "SUCCEEDED" : "FAILED",
        completedAt: new Date(),
        durationMs: 880,
        error: result.ok ? null : result.message,
      },
    });
    await ingestEvent({
      type: result.ok ? "workflow.completed" : "workflow.failed",
      title: result.ok ? `${workflow.name} executed successfully` : `${workflow.name} execution failed`,
      platformSlug: workflow.platform.slug,
      source: "workflow.execute",
      payload: { executionId: execution.id },
    });
    await writeAudit({
      actor: session.user.name,
      action: "workflow.execute",
      resource: workflow.slug,
      details: { ok: result.ok },
    });
    return { result, execution };
  });
}
