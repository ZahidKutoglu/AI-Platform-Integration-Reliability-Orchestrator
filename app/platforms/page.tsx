import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status";
import { formatMs, formatPercent, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlatformsPage() {
  const platforms = await prisma.platform.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-12">
      <PageHeader
        title="Platforms"
        description="Connected enterprise AI platforms, normalized through a shared connector interface."
      />
      <div className="grid gap-5">
        {platforms.map((platform) => (
          <Link key={platform.id} href={`/platforms/${platform.slug}`}>
            <Card className="transition hover:-translate-y-0.5">
              <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-[26px] font-semibold tracking-[-0.03em]">{platform.name}</h2>
                    <StatusBadge status={platform.status} />
                  </div>
                  <p className="mt-2 text-[15px] text-muted">{platform.description}</p>
                </div>
                <p className="text-[13px] text-faint">Synced {relativeTime(platform.lastSyncAt)}</p>
              </div>
              <dl className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6">
                <Stat label="Connection" value={platform.connectionStatus.toLowerCase()} />
                <Stat label="API health" value={platform.apiHealth.toLowerCase()} />
                <Stat label="Latency" value={formatMs(platform.latencyMs)} />
                <Stat label="Error rate" value={formatPercent(platform.errorRate)} />
                <Stat label="Workflows" value={String(platform.workflowCount)} />
                <Stat label="Users" value={platform.userCount.toLocaleString()} />
              </dl>
              <p className="mt-6 text-[13px] text-faint">Configuration · {platform.configurationStatus}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] text-faint">{label}</dt>
      <dd className="mt-1 text-[16px] font-medium capitalize tracking-[-0.02em]">{value}</dd>
    </div>
  );
}
