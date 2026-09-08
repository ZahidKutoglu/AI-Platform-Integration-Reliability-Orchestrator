import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status";
import { formatMs, formatPercent, relativeTime } from "@/lib/utils";
import { TestConnectionButton } from "@/components/platforms/test-connection";
import { ReliabilityChart } from "@/components/charts/reliability-chart";

export const dynamic = "force-dynamic";

export default async function PlatformDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const platform = await prisma.platform.findUnique({
    where: { slug },
    include: {
      healthSnapshots: { orderBy: { timestamp: "desc" }, take: 24 },
      events: { orderBy: { timestamp: "desc" }, take: 8 },
      workflows: true,
      runbooks: true,
      integrations: true,
      incidents: { orderBy: { detectedAt: "desc" }, take: 1 },
      drifts: { where: { status: { not: "REMEDIATED" } } },
    },
  });
  if (!platform) notFound();

  const lastIncident = platform.incidents[0];

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow={platform.vendor}
        title={platform.name}
        description={platform.description}
        actions={<TestConnectionButton slug={platform.slug} />}
      />
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={platform.status} />
        <p className="text-[15px] text-muted">Connected {relativeTime(platform.lastSyncAt)}</p>
      </div>

      <section>
        <h2 className="mb-5 text-[28px] font-semibold tracking-[-0.03em]">Health</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <p className="text-[13px] text-faint">API availability</p>
            <p className="mt-3 text-[28px] font-semibold tracking-[-0.04em]">{formatPercent(platform.uptimePercent)}</p>
          </Card>
          <Card>
            <p className="text-[13px] text-faint">Average latency</p>
            <p className="mt-3 text-[28px] font-semibold tracking-[-0.04em]">{formatMs(platform.latencyMs)}</p>
          </Card>
          <Card>
            <p className="text-[13px] text-faint">Error rate</p>
            <p className="mt-3 text-[28px] font-semibold tracking-[-0.04em]">{formatPercent(platform.errorRate)}</p>
          </Card>
          <Card>
            <p className="text-[13px] text-faint">Last incident</p>
            <p className="mt-3 text-[22px] font-semibold tracking-[-0.03em]">
              {lastIncident ? relativeTime(lastIncident.detectedAt) : "None"}
            </p>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Integrations</h2>
          <ul className="mt-6 divide-y divide-line">
            {[
              ["Identity", "Connected"],
              ["Webhooks", platform.slug === "n8n" && platform.status === "DEGRADED" ? "Degraded" : "Connected"],
              ["Usage API", "Connected"],
              ["Configuration API", platform.drifts.length ? "Drift detected" : "Connected"],
            ].map(([name, state]) => (
              <li key={name} className="flex items-center justify-between py-3 text-[15px]">
                <span>{name}</span>
                <StatusBadge status={state === "Connected" ? "CONNECTED" : state === "Degraded" ? "DEGRADED" : "HIGH"}>
                  {state}
                </StatusBadge>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Recent platform events</h2>
          <ul className="mt-6 space-y-4">
            {platform.events.map((event) => (
              <li key={event.id}>
                <p className="text-[15px]">{event.title}</p>
                <p className="text-[13px] text-faint">{relativeTime(event.timestamp)}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <Card>
        <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Configuration status</h2>
        <p className="mt-3 text-[15px] text-muted">{platform.configurationStatus}</p>
        {platform.drifts.length ? (
          <Link href="/configuration" className="mt-4 inline-block text-[14px] text-ink">
            Review {platform.drifts.length} drifted setting{platform.drifts.length > 1 ? "s" : ""}
          </Link>
        ) : (
          <p className="mt-4 text-[14px] text-ok">Observed configuration matches the approved baseline.</p>
        )}
      </Card>

      <section>
        <h2 className="mb-5 text-[28px] font-semibold tracking-[-0.03em]">Reliability history</h2>
        <Card>
          <ReliabilityChart
            data={platform.healthSnapshots
              .slice()
              .reverse()
              .map((point) => ({
                time: point.timestamp.toISOString(),
                availability: point.availability,
                platform: platform.slug,
              }))}
          />
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Connected workflows</h2>
          <ul className="mt-6 space-y-4">
            {platform.workflows.map((workflow) => (
              <li key={workflow.id} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[15px] font-medium">{workflow.name}</p>
                  <p className="text-[13px] text-faint">{workflow.trigger}</p>
                </div>
                <StatusBadge status={workflow.status === "active" ? "ACTIVE" : "DEGRADED"} />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Runbooks</h2>
          <ul className="mt-6 space-y-3">
            {platform.runbooks.map((runbook) => (
              <li key={runbook.id}>
                <Link href={`/runbooks/${runbook.slug}`} className="text-[15px] hover:underline">
                  {runbook.title}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
