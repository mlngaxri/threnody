import { handleContentDetail } from "@/lib/api-core";
import { guard } from "@/lib/respond";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await context.params;
  const url = new URL(request.url);
  return guard(() =>
    handleContentDetail(slug, url.searchParams, { previewSecret: process.env.PREVIEW_SECRET }),
  );
}
