import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // Keep noise down in local dev unless you explicitly set a DSN.
  enabled: Boolean(process.env.SENTRY_DSN),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  // Never attach request bodies (passwords / form fields).
  sendDefaultPii: false,
});
