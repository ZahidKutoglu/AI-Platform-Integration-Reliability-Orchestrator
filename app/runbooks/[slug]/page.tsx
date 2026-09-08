import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { RunDiagnostic } from "@/components/runbooks/diagnostic";
import { asStringArray } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RunbookDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const runbook = await prisma.runbook.findUnique({ where: { slug }, include: { platform: true } });
  if (!runbook) notFound();

  return (
    <div className="space-y-10">
      <PageHeader title={runbook.title} description={runbook.summary} actions={<RunDiagnostic slug={runbook.slug} />} />

      <Section title="Symptoms" items={asStringArray(runbook.symptoms)} />
      <Card>
        <h2 className="text-[22px] font-semibold tracking-[-0.03em]">Detection</h2>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">{runbook.detection}</p>
      </Card>
      <Section title="Automated remediation" items={asStringArray(runbook.automatedRemediation)} />
      <Section title="Manual remediation" items={asStringArray(runbook.manualRemediation)} />
      <Section title="Escalation criteria" items={asStringArray(runbook.escalationCriteria)} />
      <Section title="Recovery verification" items={asStringArray(runbook.recoveryVerification)} />
      <Section title="Post-incident steps" items={asStringArray(runbook.postIncidentSteps)} />
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <h2 className="text-[22px] font-semibold tracking-[-0.03em]">{title}</h2>
      <ul className="mt-5 space-y-2 text-[15px] leading-relaxed text-muted">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Card>
  );
}
