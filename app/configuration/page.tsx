import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status";
import { DriftActions } from "@/components/configuration/drift-actions";
import { ChangeActions } from "@/components/configuration/change-actions";

export const dynamic = "force-dynamic";

export default async function ConfigurationPage() {
  const platforms = await prisma.platform.findMany({
    include: {
      baselines: true,
      snapshots: { orderBy: { observedAt: "desc" }, take: 1 },
      drifts: { where: { status: { not: "REMEDIATED" } } },
    },
    orderBy: { name: "asc" },
  });
  const changes = await prisma.changeRequest.findMany({
    include: { platform: true, requestedBy: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-16">
      <PageHeader
        title="Configuration"
        description="Approved baselines compared with the live configuration each connector observes."
      />

      <div className="space-y-6">
        {platforms.map((platform) => {
          const observed = (platform.snapshots[0]?.values as Record<string, string>) ?? {};
          return (
            <Card key={platform.id}>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-[22px] font-semibold tracking-[-0.03em]">{platform.name}</h2>
                {platform.drifts.length ? <StatusBadge status="HIGH">Drift detected</StatusBadge> : <StatusBadge status="OPERATIONAL">Aligned</StatusBadge>}
              </div>
              <div className="mt-8 overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead className="text-[12px] text-faint">
                    <tr>
                      <th className="pb-3 font-medium">Setting</th>
                      <th className="pb-3 font-medium">Expected</th>
                      <th className="pb-3 font-medium">Observed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platform.baselines.map((baseline) => {
                      const value = observed[baseline.key] ?? "—";
                      const drifted = value !== baseline.expectedValue;
                      return (
                        <tr key={baseline.id} className="border-t border-line">
                          <td className="py-3">{baseline.label}</td>
                          <td className="py-3 text-muted">{baseline.expectedValue}</td>
                          <td className={`py-3 ${drifted ? "text-down" : "text-ink"}`}>{value}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {platform.drifts.map((drift) => (
                <div key={drift.id} className="mt-6 rounded-2xl bg-canvas px-5 py-4">
                  <p className="text-[15px] font-medium">{drift.label}</p>
                  <p className="mt-1 text-[14px] text-muted">
                    Expected {drift.expectedValue} · Observed {drift.observedValue} · {drift.severity.toLowerCase()}
                  </p>
                  <DriftActions id={drift.id} platform={platform.slug} />
                </div>
              ))}
            </Card>
          );
        })}
      </div>

      <section>
        <h2 className="mb-6 text-[28px] font-semibold tracking-[-0.03em]">Change management</h2>
        <div className="space-y-4">
          {changes.map((change) => (
            <Card key={change.id}>
              <p className="text-[13px] text-faint">{change.number}</p>
              <h3 className="mt-1 text-[22px] font-semibold tracking-[-0.03em]">{change.title}</h3>
              <p className="mt-3 text-[15px] text-muted">{change.proposedChange}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-[14px]">
                <StatusBadge status={change.status} />
                <span className="text-faint">{change.requestedBy.name}</span>
                <span className="text-faint">{change.platform.name}</span>
                <span className="text-faint">Risk {change.risk}</span>
              </div>
              <ChangeActions id={change.id} status={change.status} />
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
