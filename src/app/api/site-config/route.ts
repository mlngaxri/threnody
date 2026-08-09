import { handleSiteConfig } from "@/lib/api-core";
import { guard } from "@/lib/respond";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return guard(() => handleSiteConfig());
}
