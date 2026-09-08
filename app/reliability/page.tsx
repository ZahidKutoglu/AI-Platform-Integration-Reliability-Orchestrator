import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status";
import { formatMs, formatPercent } from "@/lib/utils";
import { sloStatus } from "@/lib/slo/metrics";
import { ReliabilityChart } from "@/components/charts/reliability-chart";

export const dynamic = "force-dynamic";

export default async function ReliabilityPage() {
  const platforms = await prisma.platform.findMany({
    include: { healthSnapshots: { orderBy: { timestamp: "asc" }, take: 24 } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-12">
      <PageHeader
        title="Reliability"
        description="Service objectives for availability, latency, errors, and workflow success."
      />
      <div className="space-y-5">
        {platforms.map((platform) => {
          const availability = sloStatus(platform.uptimePercent, platform.sloAvailability);
          const workflowCurrent = platform.slug === "n8n" ? platform.uptimePercent : 99.6;
          const workflowTarget = platform.slug === "n8n" ? 99.5 : 99.0;
          return (
            <Card key={platform.id}>
              <h2 className="text-[22px] font-semibold tracking-[-0.03em]">{platform.name}</h2>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                <Slo label="Availability SLO" target={formatPercent(platform.sloAvailability)} current={formatPercent(platform.uptimePercent)} status={availability} />
                <Slo label="Latency SLO" target={formatMs(platform.sloLatencyMs)} current={formatMs(platform.latencyMs)} status={sloStatus(platform.latencyMs, platform.sloLatencyMs, true)} />
                <Slo label="Error rate SLO" target={formatPercent(platform.sloErrorRate)} current={formatPercent(platform.errorRate)} status={sloStatus(platform.errorRate, platform.sloErrorRate, true)} />
              </div>
              <div className="mt-6">
                <Slo
                  label={platform.slug === "n8n" ? "Workflow success SLO" : "Integration uptime"}
                  target={formatPercent(workflowTarget)}
                  current={formatPercent(workflowCurrent)}
                  status={sloStatus(workflowCurrent, workflowTarget)}
                />
              </div>
            </Card>
          );
        })}
      </div>
      <Card>
        <h2 className="mb-4 text-[22px] font-semibold tracking-[-0.03em]">Trend</h2>
        <ReliabilityChart
          data={platforms.flatMap((platform) =>
            platform.healthSnapshots.map((point) => ({
              time: point.timestamp.toISOString(),
              availability: point.availability,
              platform: platform.slug,
            })),
          )}
        />
      </Card>
    </div>
  );
}

function Slo({
  label,
  target,
  current,
  status,
}: {
  label: string;
  target: string;
  current: string;
  status: string;
}) {
  return (
    <div>
      <p className="text-[13px] text-faint">{label}</p>
      <p className="mt-2 text-[13px] text-muted">Target {target}</p>
      <p className="mt-1 text-[24px] font-semibold tracking-[-0.03em]">{current}</p>
      <div className="mt-3">
        <StatusBadge status={status === "meeting" ? "OPERATIONAL" : status === "at_risk" ? "DEGRADED" : "OUTAGE"}>
          {status === "meeting" ? "Meeting SLO" : status === "at_risk" ? "At risk" : "Below SLO"}
        </StatusBadge>
      </div>
    </div>
  );
}
