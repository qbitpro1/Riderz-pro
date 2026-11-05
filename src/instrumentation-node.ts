/**
 * Node-only start-up work, imported from instrumentation.ts.
 * Sets up the Indus Enterprises store if it doesn't exist yet (see lib/server/indus-bootstrap.ts),
 * in the background so the start isn't delayed.
 */
export function afterStart() {
  void import("./lib/server/indus-bootstrap")
    .then((m) => m.ensureIndusStore())
    .catch((err: unknown) => console.error(`[indus] set-up failed: ${err instanceof Error ? err.message : String(err)}`.slice(0, 300)));
}
