import { handleRoute, ApiError } from "@/lib/http";
import { globalSearch } from "@/lib/search";

export async function GET(request: Request) {
  return handleRoute(request, async () => {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    if (q.length > 80) throw new ApiError("Search query is too long.", 400);
    return globalSearch(q);
  });
}
