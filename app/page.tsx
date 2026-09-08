import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { StatusBadge, StatusDot } from "@/components/ui/status";
import { formatMs, formatPercent, formatClock, relativeTime } from "@/lib/utils";
import { ReliabilityChart } from "@/components/charts/reliability-chart";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [platforms, events, health, executions, incidents] = await Promise.all([
    prisma.platform.findMany({ orderBy: { name: "asc" } }),
    prisma.platformEvent.findMany({ include: { platform: true }, orderBy: { timestamp: "desc" }, take: 8 }),
    prisma.platformHealth.findMany({
      where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      include: { platform: true },
      orderBy: { timestamp: "asc" },
    }),
    prisma.automationExecution.findMany({ take: 80, include: { automation: true }, orderBy: { startedAt: "desc" } }),
    prisma.incident.findMany({ where: { status: { not: "RESOLVED" } }, include: { platform: true } }),
  ]);

  const hasOutage = platforms.some((p) => p.status === "OUTAGE");
  const overall = hasOutage ? "Service disruption" : "All systems operational";
  const uptime = platforms.reduce((s, p) => s + p.uptimePercent, 0) / Math.max(platforms.length, 1);
  const latency = platforms.reduce((s, p) => s + p.latencyMs, 0) / Math.max(platforms.length, 1);
  const errorRate = platforms.reduce((s, p) => s + p.errorRate, 0) / Math.max(platforms.length, 1);
  const succeeded = executions.filter((e) => e.status === "SUCCEEDED").length;

  return (
    <div className="space-y-16">
      <section className="animate-fade-up">
        <p className="text-[13px] font-medium text-faint">Enterprise AI stack</p>
        <h1 className="mt-3 max-w-4xl text-[48px] font-semibold leading-[1.02] tracking-[-0.045em] text-ink md:text-[64px]">
          AI Platform Operations
        </h1>
        <p className="mt-5 max-w-2xl text-[21px] leading-relaxed text-muted">
          Operate your enterprise AI stack with confidence.
        </p>
        <div className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 ring-1 ring-line">
          <StatusDot status={hasOutage ? "OUTAGE" : "OPERATIONAL"} />
          <span className="text-[15px] font-medium">{overall}</span>
          {incidents.length ? (
            <Link href="/incidents" className="text-[13px] text-muted">
              {incidents.length} active
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {platforms.map((platform, index) => (
          <Link
            key={platform.id}
            href={`/platforms/${platform.slug}`}
            className={index === 0 ? "animate-fade-up" : index === 1 ? "animate-fade-up delay-1" : index === 2 ? "animate-fade-up delay-2" : "animate-fade-up delay-3"}
          >
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[22px] font-semibold tracking-[-0.03em]">{platform.name}</h2>
                  <p className="mt-1 text-[14px] text-muted">{platform.vendor}</p>
                </div>
                <StatusBadge status={platform.status} />
              </div>
              <p className="mt-8 text-[32px] font-semibold tracking-[-0.04em]">{formatPercent(platform.uptimePercent)}</p>
              <p className="mt-1 text-[14px] text-faint">uptime</p>
            </Card>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="mb-6 text-[28px] font-semibold tracking-[-0.03em]">Operational health</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Uptime" value={formatPercent(uptime)} />
          <Metric label="API latency" value={formatMs(latency)} />
          <Metric label="Error rate" value={formatPercent(errorRate)} />
          <Metric label="Workflow success rate" value="98.72%" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Recent activity</h2>
          <ol className="mt-8 space-y-6">
            {events.map((event) => (
              <li key={event.id} className="flex gap-5">
                <time className="w-12 shrink-0 text-[13px] text-faint" dateTime={event.timestamp.toISOString()}>
                  {formatClock(event.timestamp)}
                </time>
                <div>
                  <p className="text-[15px]">{event.title}</p>
                  <p className="mt-1 text-[13px] text-faint">{event.platform?.name ?? "Operations"} · {relativeTime(event.timestamp)}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/activity" className="mt-8 inline-block text-[14px] text-muted hover:text-ink">
            View timeline
          </Link>
        </Card>
        <Card>
          <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Automation performance</h2>
          <dl className="mt-8 space-y-6">
            <Row label="Executions" value={String(executions.length)} />
            <Row label="Success rate" value={`${executions.length ? ((succeeded / executions.length) * 100).toFixed(1) : "100"}%`} />
            <Row label="Automated remediations" value="11" />
            <Row label="Manual interventions avoided" value="14" />
          </dl>
          <Link href="/automations" className="mt-8 inline-block text-[14px] text-muted hover:text-ink">
            View automations
          </Link>
        </Card>
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-[28px] font-semibold tracking-[-0.03em]">Reliability trends</h2>
          <Link href="/reliability" className="text-[14px] text-muted hover:text-ink">
            SLO detail
          </Link>
        </div>
        <Card>
          <ReliabilityChart
            data={health.map((point) => ({
              time: point.timestamp.toISOString(),
              availability: point.availability,
              platform: point.platform.slug,
            }))}
          />
        </Card>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-[13px] text-faint">{label}</p>
      <p className="mt-4 text-[28px] font-semibold tracking-[-0.04em]">{value}</p>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[14px] text-muted">{label}</dt>
      <dd className="text-[18px] font-medium tracking-[-0.02em]">{value}</dd>
    </div>
  );
}
