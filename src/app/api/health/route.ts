import { handleHealth } from "@/lib/api-core";
import { guard } from "@/lib/respond";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  return guard(() => handleHealth());
}
