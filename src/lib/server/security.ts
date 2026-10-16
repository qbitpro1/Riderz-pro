import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Low-level security helpers: ids, password hashing, one-time codes, and
 * sealing (encrypting) the few secrets we must keep — bank account and PAN.
 */

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;

/** "ven_3f9c…" — 16 random bytes, URL-safe. */
export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(16).toString("base64url")}`;
}

/** An opaque bearer token for a session cookie (32 random bytes). */
export const newToken = () => randomBytes(32).toString("base64url");

/** Tokens and codes are stored hashed, never as given. */
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/* ------------------------------------------------------------- passwords */

const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

/** "scrypt$N$r$p$salt$hash" */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password.normalize("NFKC"), salt, 64, SCRYPT);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [kind, n, r, p, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const got = await scryptAsync(password.normalize("NFKC"), Buffer.from(salt, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });
  return got.length === expected.length && timingSafeEqual(got, expected);
}

/** A fixed hash to verify against when the account does not exist, so timing does not reveal it. */
let decoy: Promise<string> | null = null;
export const decoyHash = () => (decoy ??= hashPassword("not-a-real-password-0"));

/* -------------------------------------------------------- one-time codes */

export const newOtpCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

export function sameHash(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/* --------------------------------------------------------------- sealing */

/**
 * AES-256-GCM with the key in VENDOR_DATA_KEY (32 bytes, base64). In
 * development a fixed dev key is used so the portal works without setup;
 * production refuses to seal or unseal without the real key.
 */
function key(): Buffer {
  const raw = process.env.VENDOR_DATA_KEY;
  if (raw) {
    const k = Buffer.from(raw, "base64");
    if (k.length !== 32) throw new Error("VENDOR_DATA_KEY must be 32 bytes, base64-encoded");
    return k;
  }
  if (process.env.NODE_ENV === "production") throw new Error("VENDOR_DATA_KEY is not set");
  return createHash("sha256").update("riderzpro-development-only-key").digest();
}

/** "v1.iv.tag.ciphertext" */
export function seal(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return ["v1", iv.toString("base64url"), c.getAuthTag().toString("base64url"), body.toString("base64url")].join(".");
}

export function unseal(sealed: string): string {
  const [v, iv, tag, body] = sealed.split(".");
  if (v !== "v1" || !iv || !tag || !body) throw new Error("Unrecognised sealed value");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  d.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([d.update(Buffer.from(body, "base64url")), d.final()]).toString("utf8");
}
