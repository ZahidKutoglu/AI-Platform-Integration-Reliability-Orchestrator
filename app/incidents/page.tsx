import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status";
import { durationBetween } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const incidents = await prisma.incident.findMany({
    include: { platform: true, owner: true },
    orderBy: { detectedAt: "desc" },
  });
  const active = incidents.filter((i) => i.status !== "RESOLVED");
  const resolved = incidents.filter((i) => i.status === "RESOLVED");

  return (
    <div className="space-y-12">
      <PageHeader
        title="Incidents"
        description="A calm operational queue for platform failures, workflow recovery, and vendor events."
      />
      <section>
        <h2 className="mb-5 text-[22px] font-semibold tracking-[-0.03em]">Active</h2>
        {active.length === 0 ? (
          <Card>
            <EmptyState title="No active incidents" description="All platforms are running inside their expected operating envelope." />
          </Card>
        ) : (
          <div className="space-y-4">
            {active.map((incident) => (
              <IncidentRow key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-5 text-[22px] font-semibold tracking-[-0.03em]">Recently resolved</h2>
        <div className="space-y-4">
          {resolved.map((incident) => (
            <IncidentRow key={incident.id} incident={incident} />
          ))}
        </div>
      </section>
    </div>
  );
}

function IncidentRow({
  incident,
}: {
  incident: {
    id: string;
    number: string;
    title: string;
    severity: string;
    status: string;
    detectedAt: Date;
    resolvedAt: Date | null;
    platform: { name: string };
    owner: { name: string } | null;
  };
}) {
  return (
    <Link href={`/incidents/${incident.id}`}>
      <Card className="transition hover:-translate-y-0.5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[13px] text-faint">{incident.number}</p>
            <h3 className="mt-1 text-[22px] font-semibold tracking-[-0.03em]">{incident.title}</h3>
            <p className="mt-2 text-[14px] text-muted">
              {incident.platform.name} · {incident.owner?.name ?? "Unassigned"} · {durationBetween(incident.detectedAt, incident.resolvedAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={incident.severity} />
            <StatusBadge status={incident.status} />
          </div>
        </div>
      </Card>
    </Link>
  );
}
