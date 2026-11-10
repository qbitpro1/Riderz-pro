import "server-only";

import { MIGRATIONS } from "./migrations";

/**
 * THE DATABASE
 *
 * One Postgres database holds everything the vendor marketplace writes:
 * vendor accounts and KYC, vendor products, orders, payouts, notifications.
 * The house catalogue stays where it is (typed data in the repo).
 *
 *   DATABASE_URL set      → node-postgres pool (production, or a local Postgres)
 *   DATABASE_URL unset    → development only: an embedded Postgres (PGlite)
 *                           stored in .data/pglite, so the portal works with
 *                           no setup. Production refuses to start without one.
 *
 * Every query goes through `sql`, always with positional parameters ($1, $2 …).
 * Never build SQL by concatenating values.
 */

export type Row = Record<string, unknown>;

type Driver = {
  query<T extends Row>(text: string, params?: unknown[]): Promise<T[]>;
  /** Runs `fn` inside one transaction on one connection. `exec` runs a multi-statement script (migrations). */
  transaction<T>(fn: (q: Driver["query"], exec: (script: string) => Promise<void>) => Promise<T>): Promise<T>;
};

export class DatabaseNotConfigured extends Error {
  constructor() {
    super("DATABASE_URL is not set");
    this.name = "DatabaseNotConfigured";
  }
}

async function postgresDriver(url: string): Promise<Driver> {
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString: url,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    // Hosted Postgres (Neon, Supabase…) requires TLS; local servers usually do not.
    ssl: /sslmode=require|neon\.tech|supabase\.co/.test(url) ? { rejectUnauthorized: true } : undefined,
  });
  pool.on("error", (err) => console.error("[db] idle client error", err.message));
  return {
    async query(text, params) {
      const res = await pool.query(text, params as unknown[]);
      return res.rows;
    },
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const out = await fn(
          async (text, params) => (await client.query(text, params as unknown[])).rows,
          async (script) => {
            await client.query(script);
          },
        );
        await client.query("COMMIT");
        return out;
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    },
  };
}

async function embeddedDriver(): Promise<Driver> {
  const { PGlite } = await import("@electric-sql/pglite");
  const path = await import("node:path");
  const fs = await import("node:fs");
  const dir = path.join(process.cwd(), ".data", "pglite");
  fs.mkdirSync(dir, { recursive: true });
  claimEmbeddedDatabase(fs, path.join(process.cwd(), ".data", "pglite.lock"));
  const db = new PGlite(dir);
  await db.waitReady;
  // PGlite serves one query at a time; queue them so a transaction is never interleaved.
  let chain: Promise<unknown> = Promise.resolve();
  const serial = <T>(task: () => Promise<T>): Promise<T> => {
    const next = chain.then(task, task);
    chain = next.catch(() => {});
    return next;
  };
  const run = async <T extends Row>(text: string, params?: unknown[]) =>
    (await db.query<T>(text, params as unknown[])).rows;
  return {
    query: (text, params) => serial(() => run(text, params)),
    transaction: (fn) =>
      serial(async () => {
        await db.exec("BEGIN");
        try {
          const out = await fn(run, async (script) => {
            await db.exec(script);
          });
          await db.exec("COMMIT");
          return out;
        } catch (err) {
          await db.exec("ROLLBACK").catch(() => {});
          throw err;
        }
      }),
  };
}

/**
 * The embedded database can only be opened by one process. A second `npm run dev` (or a test
 * script) opening the same .data/pglite at the same time sees half-written tables ("relation
 * already exists") and can damage it. The first process writes its pid to .data/pglite.lock;
 * any other live process is refused with a message saying what to do.
 */
function claimEmbeddedDatabase(fs: typeof import("node:fs"), lockFile: string) {
  const alive = (pid: number) => {
    try {
      process.kill(pid, 0);
      return true;
    } catch (err) {
      // EPERM: the process exists but belongs to someone else.
      return (err as NodeJS.ErrnoException).code === "EPERM";
    }
  };
  try {
    const owner = Number(fs.readFileSync(lockFile, "utf8").trim());
    if (owner && owner !== process.pid && alive(owner)) {
      throw new Error(
        `The local database (.data/pglite) is already open in another process (pid ${owner}). ` +
          "Only one dev server can use it: stop the other one (close its terminal, or end that node.exe), then start again.",
      );
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
  fs.writeFileSync(lockFile, String(process.pid));
  const release = () => {
    try {
      if (fs.readFileSync(lockFile, "utf8").trim() === String(process.pid)) fs.unlinkSync(lockFile);
    } catch {
      /* already gone */
    }
  };
  process.once("exit", release);
}

async function migrate(driver: Driver): Promise<void> {
  await driver.transaction(async (q, exec) => {
    await q(`CREATE TABLE IF NOT EXISTS schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    // Serialise concurrent boots of several server instances.
    await q("SELECT pg_advisory_xact_lock(724001)");
    const done = new Set((await q<{ id: string }>("SELECT id FROM schema_migrations")).map((r) => r.id));
    for (const m of MIGRATIONS) {
      if (done.has(m.id)) continue;
      await exec(m.sql);
      await q("INSERT INTO schema_migrations (id) VALUES ($1)", [m.id]);
    }
  });
}

/** Kept on globalThis so dev hot reloads do not open a new pool each time. */
const store = globalThis as unknown as { __rzpDb?: Promise<Driver> };

function driver(): Promise<Driver> {
  if (!store.__rzpDb) {
    store.__rzpDb = (async () => {
      const url = process.env.DATABASE_URL;
      let d: Driver;
      if (url) d = await postgresDriver(url);
      else if (process.env.NODE_ENV !== "production") d = await embeddedDriver();
      else throw new DatabaseNotConfigured();
      try {
        await migrate(d);
      } catch (err) {
        // A local database whose tables exist but whose migration record doesn't (an earlier run was
        // stopped while it was being set up, or the folder came from an older copy of the app).
        if (!url && /already exists/.test(err instanceof Error ? err.message : "")) {
          const hint =
            "The local database in .data/pglite is out of step with the app (an earlier start was probably interrupted). " +
            "It only holds local test data: stop the dev server, delete the .data/pglite folder, and start again.";
          console.error(`[db] ${hint}`);
          throw new Error(`${err instanceof Error ? err.message : String(err)}. ${hint}`);
        }
        throw err;
      }
      return d;
    })();
    store.__rzpDb.catch(() => {
      store.__rzpDb = undefined;
    });
  }
  return store.__rzpDb;
}

/** True when the marketplace can run here (a database is reachable or can be created). */
export function databaseAvailable(): boolean {
  return Boolean(process.env.DATABASE_URL) || process.env.NODE_ENV !== "production";
}

/** Run one parameterised statement; returns the rows. */
export async function sql<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  return (await driver()).query<T>(text, params);
}

/** First row or null. */
export async function sqlOne<T extends Row = Row>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await sql<T>(text, params);
  return rows[0] ?? null;
}

/** `%term%` for ILIKE / LIKE with the term's own `%`, `_` and `\` matched literally (Postgres escapes with `\`). */
export const containsPattern = (term: string) => `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export type Query = <T extends Row = Row>(text: string, params?: unknown[]) => Promise<T[]>;

/** Several statements that must succeed or fail together. */
export async function transaction<T>(fn: (q: Query) => Promise<T>): Promise<T> {
  return (await driver()).transaction((q) => fn(q as Query));
}
