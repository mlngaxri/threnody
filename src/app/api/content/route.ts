import { handleContentList } from "@/lib/api-core";
import { guard } from "@/lib/respond";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  return guard(() =>
    handleContentList(url.searchParams, { previewSecret: process.env.PREVIEW_SECRET }),
  );
}
