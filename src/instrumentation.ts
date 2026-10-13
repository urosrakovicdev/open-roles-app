// instrumentation.ts — runs once when the server process starts. The place to
// wire observability (OpenTelemetry / an APM) before any request is handled.
//
// "Operate in production" includes being able to see
// what the server is doing. This hook is Next.js's official seam for that.
//
// Docs: https://nextjs.org/docs/app/guides/instrumentation
//       https://nextjs.org/docs/app/guides/open-telemetry

export async function register() {
  // TODO (M6): initialise tracing/metrics here.
  // e.g. if (process.env.NEXT_RUNTIME === "nodejs") { await import("./otel") }
}
