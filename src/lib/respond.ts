import type { HandlerResult } from "./api-core.ts";
import { fail } from "./validation.ts";

/**
 * The single adapter between the framework-free API core and Next.js.
 *
 * Every route handler is a three-line wrapper over this, which keeps the
 * framework surface tiny and means the tested core is the thing that actually
 * ships. It also guarantees that an unexpected throw anywhere in a handler
 * becomes a consistent JSON envelope rather than an HTML error page.
 */
export function respond(result: HandlerResult): Response {
  return Response.json(result.body, {
    status: result.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...(result.headers ?? {}),
    },
  });
}

/**
 * Wrap a handler so no route can ever return an unhandled 500 with a stack
 * trace. The real error is logged server side; the client gets a stable,
 * information-free envelope.
 */
export async function guard(run: () => HandlerResult | Promise<HandlerResult>): Promise<Response> {
  try {
    return respond(await run());
  } catch (error) {
    console.error("[threnody] unhandled route error:", error);
    return respond({
      status: 500,
      body: fail("INTERNAL", "The archive could not complete that request."),
      headers: { "Cache-Control": "no-store" },
    });
  }
}

/**
 * Read and parse a JSON request body without trusting the client.
 * Returns the byte length separately so size can be enforced before the
 * payload is interpreted.
 */
export async function readJson(
  request: Request,
): Promise<{ value: unknown; byteLength: number; malformed: boolean }> {
  const text = await request.text();
  const byteLength = new TextEncoder().encode(text).length;

  if (text.trim() === "") {
    return { value: null, byteLength, malformed: true };
  }
  try {
    return { value: JSON.parse(text), byteLength, malformed: false };
  } catch {
    return { value: null, byteLength, malformed: true };
  }
}
