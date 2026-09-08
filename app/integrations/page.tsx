import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status";
import { formatMs, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const integrations = await prisma.integration.findMany({
    include: { platform: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-12">
      <PageHeader
        title="Integrations"
        description="The operational fabric connecting AI platforms, identity, ticketing, and notifications."
        actions={
          <Link href="/integrations/connect" className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-medium text-white">
            Connect integration
          </Link>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {integrations.map((integration) => (
          <Link key={integration.id} href={`/integrations/${integration.slug}`}>
            <Card className="h-full transition hover:-translate-y-0.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[22px] font-semibold tracking-[-0.03em]">{integration.name}</h2>
                  <p className="mt-1 text-[13px] capitalize text-faint">{integration.kind.replaceAll("_", " ").toLowerCase()}</p>
                </div>
                <StatusBadge status={integration.status} />
              </div>
              <dl className="mt-8 grid grid-cols-2 gap-4 text-[14px]">
                <div>
                  <dt className="text-faint">Last sync</dt>
                  <dd className="mt-1">{relativeTime(integration.lastSyncAt)}</dd>
                </div>
                <div>
                  <dt className="text-faint">Health</dt>
                  <dd className="mt-1 capitalize">{integration.health.toLowerCase()}</dd>
                </div>
                <div>
                  <dt className="text-faint">Events received</dt>
                  <dd className="mt-1">{integration.eventsReceived.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-faint">API latency</dt>
                  <dd className="mt-1">{formatMs(integration.apiLatencyMs)}</dd>
                </div>
              </dl>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
