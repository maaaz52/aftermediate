// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 0.1,

  // Suppress request/response bodies and user info: chat request bodies carry
  // student context (marks, budget) and OCR bodies carry base64 marksheets.
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
});
