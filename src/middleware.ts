import { NextResponse, type NextRequest } from "next/server";
import { isUnknownArchivePath, NOT_IN_ARCHIVE_PATH } from "@/lib/routing";

/**
 * Turn an unknown entry or category slug into an honest 404.
 *
 * Rewriting to a path that matches no route is what makes this work: Next then
 * renders app/not-found.tsx and sends 404, which it cannot do once a
 * dynamically rendered page has already started streaming a 200.
 */
export function middleware(request: NextRequest) {
  if (isUnknownArchivePath(request.nextUrl.pathname)) {
    return NextResponse.rewrite(new URL(NOT_IN_ARCHIVE_PATH, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/entries/:path*", "/categories/:path*"],
};
