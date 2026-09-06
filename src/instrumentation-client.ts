// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://db154cc173c2f73fdb6cdf27551e8503@o4512016614817792.ingest.de.sentry.io/4512016634937424",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Replay is disabled: it captures the rendered DOM, which contains student
  // marks, budgets and essay drafts. Errors are reported without a replay.
  // dataCollection: request/response bodies and user info are suppressed so
  // chat prompts (with student context) and OCR marksheet images never leave.
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
