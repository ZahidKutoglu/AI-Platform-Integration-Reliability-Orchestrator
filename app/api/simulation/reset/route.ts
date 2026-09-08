import { handleRoute } from "@/lib/http";
import { getOperatorSession, assertRole } from "@/lib/auth";
import { seedDatabase } from "@/prisma/seed";

export async function POST(request: Request) {
  return handleRoute(request, async () => {
    const session = await getOperatorSession();
    assertRole(session, ["ADMIN", "OPERATOR"]);
    await seedDatabase();
    return { ok: true, kind: "reset" as const };
  });
}
