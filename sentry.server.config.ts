// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://db154cc173c2f73fdb6cdf27551e8503@o4512016614817792.ingest.de.sentry.io/4512016634937424",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Suppress request/response bodies and user info: chat request bodies carry
  // student context (marks, budget) and OCR bodies carry base64 marksheets.
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
});
