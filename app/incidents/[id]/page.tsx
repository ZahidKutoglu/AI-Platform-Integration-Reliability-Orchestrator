import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status";
import { durationBetween, formatDateTime, asStringArray } from "@/lib/utils";
import { IncidentActions } from "@/components/incidents/actions";

export const dynamic = "force-dynamic";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incident = await prisma.incident.findFirst({
    where: { OR: [{ id }, { number: id }] },
    include: {
      platform: true,
      owner: true,
      timeline: { orderBy: { timestamp: "asc" } },
      escalations: true,
    },
  });
  if (!incident) notFound();

  const related = await prisma.platformEvent.findMany({
    where: { platformId: incident.platformId, timestamp: { gte: incident.detectedAt } },
    orderBy: { timestamp: "asc" },
    take: 12,
  });

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow={incident.number}
        title={incident.title}
        description={incident.summary}
        actions={<IncidentActions id={incident.id} status={incident.status} />}
      />
      <div className="flex flex-wrap gap-2">
        <StatusBadge status={incident.severity} />
        <StatusBadge status={incident.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-[13px] text-faint">Affected platform</p>
          <p className="mt-2 text-[18px] font-medium">{incident.platform.name}</p>
        </Card>
        <Card>
          <p className="text-[13px] text-faint">Duration</p>
          <p className="mt-2 text-[18px] font-medium">{durationBetween(incident.detectedAt, incident.resolvedAt)}</p>
        </Card>
        <Card>
          <p className="text-[13px] text-faint">Owner</p>
          <p className="mt-2 text-[18px] font-medium">{incident.owner?.name ?? "Unassigned"}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Impact</h2>
          <dl className="mt-6 space-y-4 text-[15px]">
            <div className="flex justify-between gap-4"><dt className="text-muted">Affected workflows</dt><dd>{asStringArray(incident.affectedWorkflows).join(", ") || "None"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Affected users</dt><dd>{incident.affectedUsers}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Detected</dt><dd>{formatDateTime(incident.detectedAt)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted">Vendor status</dt><dd>{incident.vendorStatus}</dd></div>
          </dl>
        </Card>
        <Card>
          <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Cause and remediation</h2>
          <p className="mt-6 text-[15px] leading-relaxed text-muted">{incident.rootCause ?? "Investigation in progress."}</p>
          <p className="mt-4 text-[15px] leading-relaxed">{incident.remediation ?? "No remediation recorded yet."}</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Timeline</h2>
        <ol className="mt-8 space-y-6">
          {incident.timeline.map((item) => (
            <li key={item.id} className="grid grid-cols-[120px_1fr] gap-4">
              <time className="text-[13px] text-faint">{formatDateTime(item.timestamp)}</time>
              <div>
                <p className="text-[15px]">{item.message}</p>
                <p className="mt-1 text-[13px] text-faint">{item.actor}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Related events</h2>
        <ul className="mt-6 space-y-3">
          {related.map((event) => (
            <li key={event.id} className="flex justify-between gap-4 text-[14px]">
              <span>{event.title}</span>
              <span className="text-faint">{event.correlationId}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
