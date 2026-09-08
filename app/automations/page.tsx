import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const automations = await prisma.automation.findMany({
    include: { platform: true, executions: { orderBy: { startedAt: "desc" }, take: 1 } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-12">
      <PageHeader
        title="Automations"
        description="Operational workflows that detect, recover, and notify without waiting for a human queue."
      />
      <div className="space-y-4">
        {automations.map((automation) => (
          <Link key={automation.id} href={`/automations/${automation.slug}`}>
            <Card className="transition hover:-translate-y-0.5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-[22px] font-semibold tracking-[-0.03em]">{automation.name}</h2>
                    <StatusBadge status={automation.status} />
                  </div>
                  <p className="mt-2 max-w-2xl text-[15px] text-muted">{automation.description}</p>
                </div>
                <p className="text-[13px] text-faint">
                  {automation.lastExecutionAt ? `Last run ${relativeTime(automation.lastExecutionAt)}` : "Never run"}
                </p>
              </div>
              <dl className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
                <div>
                  <dt className="text-[12px] text-faint">Trigger</dt>
                  <dd className="mt-1 text-[14px]">{automation.trigger}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-faint">Action</dt>
                  <dd className="mt-1 text-[14px]">{automation.action}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-faint">Success rate</dt>
                  <dd className="mt-1 text-[14px]">{automation.successRate.toFixed(1)}%</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-faint">Avg. execution</dt>
                  <dd className="mt-1 text-[14px]">{automation.avgExecutionMs} ms</dd>
                </div>
              </dl>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
