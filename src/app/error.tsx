"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-level error boundary. Next.js renders this in place of the segment
 * when a render throws.
 *
 * It never prints the raw error message to the page, because a server error
 * message can contain internal paths. The digest is safe: it is a hash Next
 * generates specifically so a user can quote it without leaking anything.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Console only, never rendered. In a production system this is where an
    // error reporter would be called.
    console.error("[threnody] route error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="shell" style={{ paddingBlock: "var(--sp-9)" }}>
      <div className="state state--error" role="alert">
        <p className="eyebrow">Playback failure</p>
        <h1 className="state__title" style={{ fontSize: "var(--step-4)" }}>
          The archive lost the thread
        </h1>
        <p className="state__body">
          Something in this view failed while it was being assembled. Your place in the archive is
          not lost, and nothing you did caused it. Trying again re-renders only this section, so it
          is worth one attempt before navigating away.
        </p>
        {error.digest ? (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--step--2)",
              color: "var(--text-faint)",
            }}
          >
            Reference {error.digest}
          </p>
        ) : null}
        <div style={{ display: "flex", gap: "var(--sp-4)", flexWrap: "wrap" }}>
          <button type="button" className="btn btn--primary" onClick={reset}>
            Try this view again
          </button>
          <Link href="/atlas" className="btn">
            Back to the atlas
          </Link>
          <Link href="/api/health" className="btn">
            Check archive health
          </Link>
        </div>
      </div>
    </div>
  );
}
