import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status";
import { formatDateTime } from "@/lib/utils";
import { IntegrationActions } from "@/components/integrations/actions";

export const dynamic = "force-dynamic";

export default async function IntegrationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const integration = await prisma.integration.findUnique({
    where: { slug },
    include: { platform: true, logs: { orderBy: { timestamp: "desc" }, take: 20 } },
  });
  if (!integration) notFound();

  return (
    <div className="space-y-12">
      <PageHeader
        title={integration.name}
        description="Connector status, configuration, and delivery logs."
        actions={<IntegrationActions slug={integration.slug} status={integration.status} />}
      />
      <div className="flex gap-2">
        <StatusBadge status={integration.status} />
        <StatusBadge status={integration.health} />
      </div>
      <Card>
        <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Configuration</h2>
        <pre className="mt-6 overflow-auto text-[13px] leading-relaxed text-muted">
          {JSON.stringify(integration.configJson, null, 2)}
        </pre>
      </Card>
      <Card>
        <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Logs</h2>
        <ul className="mt-6 space-y-4">
          {integration.logs.map((log) => (
            <li key={log.id}>
              <p className="text-[15px]">{log.message}</p>
              <p className="text-[13px] text-faint">{formatDateTime(log.timestamp)} · {log.level}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
