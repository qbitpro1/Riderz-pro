#!/usr/bin/env node
/**
 * TEST LOGINS FOR LOCAL WORK — two customers, two sellers and one admin team member.
 * (The second admin is the owner login, ADMIN_USER / ADMIN_PASSWORD in .env.local.)
 *
 *   npm run seed:logins        (start `npm run dev` once first, so the tables exist)
 *
 * Writes to the database in DATABASE_URL (schema DATABASE_SCHEMA), or refuses. Safe to run again:
 * existing accounts with these emails get their password and approval reset, nothing else changes.
 * Never run against production: these passwords are in this file.
 *
 * Customers sign in with a one-time code (no password). In development the code is printed in
 * the `npm run dev` terminal, as "[otp] … code 123456".
 */
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";

export const TEST_LOGINS = {
  admins: [
    // The owner login comes from .env.local (ADMIN_USER / ADMIN_PASSWORD); shown here for reference.
    { email: "owner@riderzpro.test", password: "OwnerTest-2026", role: "owner", name: "Test Owner", fromEnv: true },
    { email: "manager@riderzpro.test", password: "ManagerTest-2026", role: "manager", name: "Test Manager" },
  ],
  sellers: [
    { email: "gadgethub@riderzpro.test", mobile: "9000000011", password: "GadgetHub2026", storeName: "Gadget Hub", slug: "gadget-hub", fullName: "Ravi Kumar", city: "Bengaluru", state: "Karnataka", pincode: "560001" },
    { email: "autostyle@riderzpro.test", mobile: "9000000012", password: "AutoStyle2026", storeName: "AutoStyle Accessories", slug: "autostyle-accessories", fullName: "Priya Sharma", city: "Pune", state: "Maharashtra", pincode: "411001" },
  ],
  customers: [
    { email: "asha@riderzpro.test", mobile: "9000000021", name: "Asha Verma" },
    { email: "rahul@riderzpro.test", mobile: "9000000022", name: "Rahul Mehta" },
  ],
};

const scryptAsync = promisify(scrypt);
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** Same "scrypt$N$r$p$salt$hash" format as src/lib/server/security.ts. */
async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password.normalize("NFKC"), salt, 64, SCRYPT);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), hash.toString("base64")].join("$");
}
const newId = (prefix) => `${prefix}_${randomBytes(16).toString("base64url")}`;

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed test logins in production.");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Run with: node --env-file=.env.local scripts/seed-dev-logins.mjs");
  const schema = process.env.DATABASE_SCHEMA?.trim() || null;
  if (schema && !/^[a-z_][a-z0-9_]{0,62}$/.test(schema)) throw new Error("DATABASE_SCHEMA is not a valid name");

  const client = new pg.Client({ connectionString: url, ...(schema ? { options: `-c search_path=${schema}` } : {}) });
  await client.connect();
  try {
    const ready = await client.query("SELECT to_regclass('vendors') AS t");
    if (!ready.rows[0].t) throw new Error("The app's tables don't exist yet. Start `npm run dev` and open the site once, then run this again.");

    await client.query("BEGIN");

    for (const a of TEST_LOGINS.admins.filter((x) => !x.fromEnv)) {
      await client.query(
        `INSERT INTO admin_users (id, email, name, role, status, source, password_hash, created_by)
         VALUES ($1, $2, $3, $4, 'active', 'team', $5, 'seed')
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, status = 'active',
           password_hash = EXCLUDED.password_hash, updated_at = now()`,
        [newId("adm"), a.email, a.name, a.role, await hashPassword(a.password)],
      );
    }

    for (const s of TEST_LOGINS.sellers) {
      const onboarding = {
        store: {
          storeName: s.storeName,
          slug: s.slug,
          sellerType: "Retailer",
          description: `${s.storeName}: test store for local work.`,
          departments: ["interior", "accessories", "multimedia"],
          brands: [{ name: "Various", authType: "Authorised" }],
          logoFileId: null,
          bannerFileId: null,
        },
        shipping: {
          pickup: { line1: "12 Test Street", line2: null, city: s.city, state: s.state, pincode: s.pincode },
          contactPhone: s.mobile,
          handlingDays: 2,
          shipsTo: "pan_india",
          acceptsReturns: true,
          returnWindowDays: 7,
        },
      };
      const hash = await hashPassword(s.password);
      const existing = await client.query("SELECT id FROM vendors WHERE lower(email) = $1", [s.email]);
      if (existing.rows[0]) {
        await client.query(
          `UPDATE vendors SET password_hash = $2, status = 'approved', store_name = $3, slug = $4, onboarding = $5::jsonb,
                  approved_at = COALESCE(approved_at, now()), approved_by = COALESCE(approved_by, 'seed'), updated_at = now()
            WHERE id = $1`,
          [existing.rows[0].id, hash, s.storeName, s.slug, JSON.stringify(onboarding)],
        );
      } else {
        await client.query(
          `INSERT INTO vendors (id, email, mobile, password_hash, full_name, business_type, status, email_verified_at, mobile_verified_at,
                                store_name, slug, onboarding, current_step, completed_steps, commission_rate, tier,
                                submitted_at, approved_at, approved_by)
           VALUES ($1, $2, $3, $4, $5, 'Proprietorship', 'approved', now(), now(), $6, $7, $8::jsonb, 6, '{1,2,3,4,5,6}',
                   10, 'standard', now(), now(), 'seed')`,
          [newId("ven"), s.email, s.mobile, hash, s.fullName, s.storeName, s.slug, JSON.stringify(onboarding)],
        );
      }
    }

    for (const c of TEST_LOGINS.customers) {
      await client.query(
        `INSERT INTO customers (id, name, mobile, email, mobile_verified_at, email_verified_at)
         VALUES ($1, $2, $3, $4, now(), now())
         ON CONFLICT (lower(email)) WHERE email IS NOT NULL DO UPDATE SET name = EXCLUDED.name, updated_at = now()`,
        [newId("cus"), c.name, c.mobile, c.email],
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end();
  }

  console.log("Test logins are ready (details in scripts/seed-dev-logins.mjs):");
  console.log("  Admins     /admin/sign-in    ", TEST_LOGINS.admins.map((a) => a.email).join(", "));
  console.log("  Sellers    /vendor/auth      ", TEST_LOGINS.sellers.map((s) => s.email).join(", "));
  console.log("  Customers  /account/sign-in  ", TEST_LOGINS.customers.map((c) => c.email).join(", "), "(code printed in the dev terminal)");
}

main().catch((err) => {
  console.error("seed failed:", err.message);
  process.exit(1);
});
