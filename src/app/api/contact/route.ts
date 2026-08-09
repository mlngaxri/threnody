import { handleContact, methodNotAllowed } from "@/lib/api-core";
import { guard, readJson } from "@/lib/respond";
import { clientKey, fail } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return guard(async () => {
    const { value, byteLength, malformed } = await readJson(request);

    if (malformed) {
      return {
        status: 400,
        body: fail("BAD_REQUEST", "The request body was not valid JSON."),
        headers: { "Cache-Control": "no-store" },
      };
    }

    return handleContact(value, {
      clientKey: clientKey(request.headers),
      byteLength,
    });
  });
}

// Explicit method guards so a stray GET returns a JSON 405 with an Allow
// header rather than the framework's default HTML response.
export async function GET(): Promise<Response> {
  return guard(() => methodNotAllowed(["POST"]));
}

export async function PUT(): Promise<Response> {
  return guard(() => methodNotAllowed(["POST"]));
}

export async function DELETE(): Promise<Response> {
  return guard(() => methodNotAllowed(["POST"]));
}
