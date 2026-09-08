import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status";
import { formatDateTime } from "@/lib/utils";
import { ExecuteWorkflowButton } from "@/components/automations/execute";

export const dynamic = "force-dynamic";

export default async function AutomationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const automation = await prisma.automation.findUnique({
    where: { slug },
    include: { platform: true, executions: { orderBy: { startedAt: "desc" }, take: 12 } },
  });
  if (!automation) notFound();
  const workflowSlug =
    {
      "platform-health-monitor": "platform-health-alert",
      "configuration-drift-monitor": "configuration-drift",
    }[automation.slug] ?? automation.slug;
  const workflow = await prisma.workflow.findUnique({ where: { slug: workflowSlug } });

  return (
    <div className="space-y-12">
      <PageHeader
        title={automation.name}
        description={automation.description}
        actions={workflow ? <ExecuteWorkflowButton slug={workflow.slug} /> : null}
      />
      <div className="flex gap-2">
        <StatusBadge status={automation.status} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-[13px] text-faint">Trigger</p>
          <p className="mt-2 text-[16px]">{automation.trigger}</p>
        </Card>
        <Card>
          <p className="text-[13px] text-faint">Action</p>
          <p className="mt-2 text-[16px]">{automation.action}</p>
        </Card>
        <Card>
          <p className="text-[13px] text-faint">n8n workflow</p>
          <p className="mt-2 text-[16px]">{automation.n8nWorkflowFile ?? "Internal engine"}</p>
        </Card>
      </div>
      <Card>
        <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Recent executions</h2>
        <ul className="mt-6 divide-y divide-line">
          {automation.executions.map((execution) => (
            <li key={execution.id} className="flex items-center justify-between py-3 text-[14px]">
              <span>{formatDateTime(execution.startedAt)}</span>
              <StatusBadge status={execution.status} />
              <span className="text-faint">{execution.durationMs ?? "—"} ms</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
