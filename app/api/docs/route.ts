import { API_CATALOG } from "@/lib/docs/catalog";
import { handleRoute } from "@/lib/http";

export async function GET(request: Request) {
  return handleRoute(request, async () => ({ endpoints: API_CATALOG }));
}
