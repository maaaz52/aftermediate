"use client";

import * as Sentry from "@sentry/nextjs";
import Error from "next/error";
import { useEffect } from "react";

/**
 * Global error boundary for the App Router. Catches uncaught render errors in
 * the root layout and reports them to Sentry before rendering a fallback.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif" }}>
        <Error
          statusCode={500}
          title="Something went wrong. We've been notified and are looking into it."
        />
      </body>
    </html>
  );
}