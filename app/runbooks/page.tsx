import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function RunbooksPage() {
  const runbooks = await prisma.runbook.findMany({ include: { platform: true }, orderBy: { title: "asc" } });

  return (
    <div className="space-y-12">
      <PageHeader
        title="Runbooks"
        description="Interactive operational guides for platform degradation, workflow failure, and recovery."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {runbooks.map((runbook) => (
          <Link key={runbook.id} href={`/runbooks/${runbook.slug}`}>
            <Card className="h-full transition hover:-translate-y-0.5">
              <h2 className="text-[22px] font-semibold tracking-[-0.03em]">{runbook.title}</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{runbook.summary}</p>
              <p className="mt-6 text-[13px] text-faint">{runbook.platform?.name ?? "All platforms"}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
