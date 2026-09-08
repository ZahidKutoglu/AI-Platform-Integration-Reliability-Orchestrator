import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { SimulationControls } from "@/components/simulation/controls";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/ui/status";

export const dynamic = "force-dynamic";

export default async function SimulationPage() {
  const [platforms, incidents, state] = await Promise.all([
    prisma.platform.findMany({ orderBy: { name: "asc" } }),
    prisma.incident.findMany({ where: { status: { not: "RESOLVED" } }, include: { platform: true } }),
    prisma.simulationState.findUnique({ where: { id: "demo" } }),
  ]);

  return (
    <div className="space-y-12">
      <PageHeader
        title="Simulation Center"
        description="Change live operational state. Incidents, remediations, notifications, and the overview all react."
      />
      <SimulationControls />
      <div className="grid gap-4 md:grid-cols-2">
        {platforms.map((platform) => (
          <Card key={platform.id}>
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-semibold tracking-[-0.03em]">{platform.name}</h2>
              <StatusBadge status={platform.status} />
            </div>
            <p className="mt-4 text-[14px] text-muted">
              Error rate {platform.errorRate.toFixed(2)}% · Latency {platform.latencyMs} ms
            </p>
          </Card>
        ))}
      </div>
      <Card>
        <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Active incidents</h2>
        <ul className="mt-6 space-y-3 text-[15px]">
          {incidents.length === 0 ? <li className="text-muted">None. Simulate a failure to open the lifecycle.</li> : null}
          {incidents.map((incident) => (
            <li key={incident.id}>
              {incident.number} · {incident.title} · {incident.platform.name}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[13px] text-faint">
          Active scenarios: {(state?.activeScenarios as string[] | undefined)?.join(", ") || "none"}
        </p>
      </Card>
    </div>
  );
}
