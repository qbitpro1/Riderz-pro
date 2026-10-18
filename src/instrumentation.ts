/**
 * Runs once when a server instance starts (Next.js instrumentation). In production it checks the
 * settings: missing essentials stop the start with a clear message instead of failing on the first
 * order; everything that is merely off is listed once in the log.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  const { checkConfig } = await import("./lib/server/config-check");
  const { problems, warnings, features } = checkConfig();
  const on = Object.entries(features).filter(([, v]) => v).map(([k]) => k);
  console.info(`[config] features on: ${on.join(", ") || "none"}`);
  for (const w of warnings) console.warn(`[config] ${w}`);
  if (problems.length) {
    for (const p of problems) console.error(`[config] ${p}`);
    throw new Error(`Riderzpro can't start: ${problems.length} required setting(s) missing or invalid (see the log above).`);
  }
}

/** Server errors in one line each, without request bodies or personal data. */
export async function onRequestError(err: unknown, request: { path: string; method: string }, context: { routeType: string }) {
  const e = err as { message?: string; digest?: string };
  console.error(`[error] ${request.method} ${request.path} (${context.routeType}) ${e?.digest ?? ""} ${e?.message ?? String(err)}`.slice(0, 500));
}
