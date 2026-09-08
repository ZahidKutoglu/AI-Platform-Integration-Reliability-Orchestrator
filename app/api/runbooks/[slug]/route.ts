import { prisma } from "@/lib/db";
import { ApiError, handleRoute } from "@/lib/http";
import { runRunbookDiagnostic } from "@/lib/runbooks/diagnostics";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return handleRoute(request, async () => {
    const runbook = await prisma.runbook.findUnique({
      where: { slug },
      include: { platform: true },
    });
    if (!runbook) throw new ApiError("Runbook not found.", 404);
    return { runbook };
  });
}

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  return handleRoute(request, async () => runRunbookDiagnostic(slug));
}
