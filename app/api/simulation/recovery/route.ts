import { handleRoute } from "@/lib/http";
import { recoverEnvironment } from "@/lib/simulation/engine";
import { getOperatorSession, assertRole } from "@/lib/auth";

export async function POST(request: Request) {
  return handleRoute(request, async () => {
    const session = await getOperatorSession();
    assertRole(session, ["ADMIN", "OPERATOR"]);
    return recoverEnvironment();
  });
}
