#!/usr/bin/env node
/**
 * Re-reads each source's robots.txt and reports drift from the evidence
 * recorded in src/lib/inventory/sources.ts.
 *
 *   node scripts/check-robots.mjs
 *
 * This is a compliance audit, not a crawler: it fetches one well-known file per
 * host and reads it. If a rule we cited has disappeared — or a new one has
 * appeared — that is a prompt to re-read the terms before changing anything,
 * not a signal to start importing.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCES_FILE = resolve(ROOT, "src/lib/inventory/sources.ts");
const UA = "Mozilla/5.0 (compatible; RiderzproComplianceCheck/1.0)";

// Read the recorded evidence straight out of the registry, so the audit can
// never drift from what the application believes.
const src = readFileSync(SOURCES_FILE, "utf8");
const recorded = [...src.matchAll(/id:\s*"([^"]+)"[\s\S]*?robotsUrl:\s*(?:"([^"]+)"|null)[\s\S]*?blockingRules:\s*\[([^\]]*)\]/g)].map(
  (m) => ({
    id: m[1],
    robotsUrl: m[2] ?? null,
    rules: [...m[3].matchAll(/"([^"]+)"/g)].map((r) => r[1]),
  }),
);

let drift = 0;

for (const entry of recorded) {
  if (!entry.robotsUrl) continue;

  process.stdout.write(`\n${entry.id}\n  ${entry.robotsUrl}\n`);

  let text;
  try {
    const res = await fetch(entry.robotsUrl, { headers: { "user-agent": UA } });
    if (!res.ok) {
      console.log(`  ! HTTP ${res.status} — could not read robots.txt`);
      drift++;
      continue;
    }
    text = await res.text();
  } catch (error) {
    console.log(`  ! fetch failed: ${error.message}`);
    drift++;
    continue;
  }

  const flat = text.replace(/\s+/g, " ");
  for (const rule of entry.rules) {
    // Recorded rules may carry a trailing human note in brackets.
    const bare = rule.replace(/\s*\(.*$/, "").trim();
    const present = flat.includes(bare);
    console.log(`  ${present ? "✓" : "✗"} ${bare}`);
    if (!present) drift++;
  }
}

console.log(
  drift === 0
    ? "\nAll recorded robots.txt rules are still in place. No change to the compliance position."
    : `\n${drift} recorded rule(s) could not be confirmed. Re-read the sources' terms before changing any source status.`,
);
process.exit(0);
