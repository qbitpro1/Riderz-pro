#!/usr/bin/env node
/**
 * Inventory refresh runner.
 *
 *   node scripts/inventory-refresh.mjs
 *   node scripts/inventory-refresh.mjs --pull https://dealer.example.com/feed.json
 *
 * Pulls connected partner dealer feeds, validates them, and writes
 * data/inventory/dealer-feed.json for the application to read at build time.
 *
 * It will not touch a source that has no licence recorded. The marketplace
 * connectors are intentionally inert here: aggregating them needs a data
 * agreement, not a cleverer script.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FEED_FILE = resolve(ROOT, "data/inventory/dealer-feed.json");

const args = process.argv.slice(2);
const pullUrl = args.includes("--pull") ? args[args.indexOf("--pull") + 1] : null;

const feed = JSON.parse(readFileSync(FEED_FILE, "utf8"));

console.log("Motorbotz inventory refresh");
console.log("───────────────────────────");

if (!feed.agreementRef) {
  console.log("\nPartner dealer feed: NOT CONNECTED");
  console.log("  data/inventory/dealer-feed.json has no `agreementRef`.");
  console.log("  A signed Dealer Inventory Agreement is what grants display rights, so nothing");
  console.log("  is imported until that reference is filled in. Sign a dealer, set the reference,");
  console.log("  then re-run this command.\n");
} else {
  let vehicles = feed.vehicles ?? [];

  if (pullUrl) {
    console.log(`\nPulling ${pullUrl}`);
    const res = await fetch(pullUrl, {
      headers: { "user-agent": "MotorbotzInventory/1.0", accept: "application/json" },
    });
    if (!res.ok) {
      console.error(`  ! HTTP ${res.status} — feed not updated`);
      process.exit(1);
    }
    const payload = await res.json();
    vehicles = Array.isArray(payload) ? payload : (payload.vehicles ?? []);
    console.log(`  received ${vehicles.length} vehicles`);
  }

  const problems = [];
  const accepted = [];
  for (const v of vehicles) {
    const issues = validate(v);
    if (issues.length) problems.push({ stockId: v.stockId ?? "(no stockId)", issues });
    else accepted.push(v);
  }

  const noImages = accepted.filter((v) => v.imageRights !== "granted").length;

  writeFileSync(
    FEED_FILE,
    JSON.stringify({ ...feed, generatedAt: new Date().toISOString(), vehicles: accepted }, null, 2),
    "utf8",
  );

  console.log(`\nPartner dealer feed: CONNECTED (${feed.agreementRef})`);
  console.log(`  accepted        ${accepted.length}`);
  console.log(`  rejected        ${problems.length}`);
  console.log(`  without images  ${noImages} (will display "Photos unavailable")`);
  for (const p of problems) console.log(`   ! ${p.stockId}: ${p.issues.join("; ")}`);
}

console.log("Marketplace sources: SKIPPED");
console.log("  CarDekho, CARS24, Spinny, CarWale and OLX Autos are registered but have no data");
console.log("  licence. Their robots files disallow the inventory paths this would need, so the");
console.log("  connectors refuse to run. Run `npm run inventory:check-robots` to re-audit.\n");

console.log("Next: rebuild or restart the app — the snapshot is assembled at server start.");

function validate(v) {
  const issues = [];
  if (!v || typeof v !== "object") return ["not an object"];
  if (!v.stockId) issues.push("stockId is required");
  if (!v.dealerId || !v.dealerName) issues.push("dealerId and dealerName are required");
  if (!v.make || !v.model) issues.push("make and model are required");
  if (!Number.isFinite(v.year)) issues.push("year must be a number");
  if (!Number.isFinite(v.price)) issues.push("price must be a number");
  if (v.images?.length && v.imageRights !== "granted") {
    issues.push('images supplied without imageRights:"granted" — they would not be displayed');
  }
  // Never accept a claim we cannot attribute.
  if (v.verified || v.motorbotzVerified) {
    issues.push("a feed cannot set verified status — only a Motorbotz inspection can");
  }
  return issues;
}
