import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { formatClock, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const events = await prisma.platformEvent.findMany({
    include: { platform: true },
    orderBy: { timestamp: "desc" },
    take: 40,
  });

  return (
    <div className="space-y-12">
      <PageHeader title="Activity" description="A chronological record of connector, workflow, and remediation events." />
      <Card>
        <ol className="space-y-7">
          {events.map((event) => (
            <li key={event.id} className="flex gap-6">
              <time className="w-12 shrink-0 text-[13px] text-faint">{formatClock(event.timestamp)}</time>
              <div>
                <p className="text-[16px]">{event.title}</p>
                <p className="mt-1 text-[13px] text-faint">
                  {event.platform?.name ?? "Operations"} · {event.type} · {relativeTime(event.timestamp)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
