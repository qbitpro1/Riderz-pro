/**
 * Node-only start-up work, imported from instrumentation.ts, in the background so the start isn't delayed.
 *  1. Adds any product from the brand price lists that isn't in the database yet (lib/server/catalog.ts).
 *  2. Sets up the Indus Enterprises store if it doesn't exist yet (lib/server/indus-bootstrap.ts); it copies
 *     some catalogue products, so it runs after the import.
 */
export function afterStart() {
  const say = (what: string) => (err: unknown) => console.error(`[${what}] failed: ${err instanceof Error ? err.message : String(err)}`.slice(0, 300));
  void import("./lib/server/catalog")
    .then((m) => m.importCatalogFromFiles())
    .catch(say("catalog import"))
    .then(() => import("./lib/server/indus-bootstrap"))
    .then((m) => m.ensureIndusStore())
    .catch(say("indus set-up"));
}
