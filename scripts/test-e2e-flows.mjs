#!/usr/bin/env node
/**
 * End-to-end check that every main flow reaches the database, against a RUNNING dev server.
 *
 *   npm run dev                                  (in one terminal; ADMIN_USER unset → /admin open locally)
 *   node scripts/test-e2e-flows.mjs [baseUrl] [devLogFile]
 *
 * Sign-in codes are read from the dev server's console output (development prints them), so pass
 * the file the server's output is written to (default .data/dev.log).
 *
 * Flows: customer sign-in by code → profile → car → addresses → saved cart → wishlist → order
 * (WhatsApp) → order in account; seller sign-up → email/mobile codes → onboarding steps →
 * document uploads → submit → admin queue → approve → product → admin approves product → customer
 * orders it → seller moves it → seller stats; admin reports for all sellers and for one; admin
 * freezes the seller with a message → seller locked, sees it → replies with a document → admin
 * reads the reply and the document → admin lifts the freeze.
 */
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const BASE = process.argv[2] ?? "http://localhost:3000";
const LOG = process.argv[3] ?? ".data/dev.log";
const RUN = Date.now().toString().slice(-6);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0;
const failures = [];
async function step(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`ok    ${name}`);
  } catch (err) {
    failures.push(name);
    console.log(`FAIL  ${name}\n      ${String(err?.message ?? err).split("\n").slice(0, 6).join("\n      ")}`);
  }
}

/** A tiny client with its own cookie jar (one per person). */
function client(label) {
  const jar = new Map();
  const call = async (method, path, body, { form } = {}) => {
    const headers = { origin: BASE, cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "), "user-agent": `e2e-${label}` };
    let payload;
    if (form) payload = form;
    else if (body !== undefined) {
      headers["content-type"] = "application/json";
      payload = JSON.stringify(body);
    }
    const res = await fetch(BASE + path, { method, headers, body: payload, redirect: "manual" });
    for (const c of res.headers.getSetCookie?.() ?? []) {
      const [pair] = c.split(";");
      const i = pair.indexOf("=");
      const k = pair.slice(0, i), v = pair.slice(i + 1);
      if (/max-age=0|expires=thu, 01 jan 1970/i.test(c) || v === "") jar.delete(k);
      else jar.set(k, v);
    }
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* html */ }
    return { status: res.status, json, text };
  };
  const expect = async (want, method, path, body, opts) => {
    const r = await call(method, path, body, opts);
    if (r.status !== want) throw new Error(`${method} ${path} → ${r.status} (wanted ${want}) ${r.text.slice(0, 400)}`);
    return r.json ?? r.text;
  };
  return { call, expect, jar };
}

/** The newest dev code printed for this target after `since` lines. */
async function codeFor(target, sinceLines) {
  for (let i = 0; i < 40; i++) {
    const lines = readFileSync(LOG, "utf8").split("\n").slice(sinceLines);
    const hit = lines.reverse().find((l) => l.includes("[otp:dev]") && l.includes(` ${target}:`));
    if (hit) return hit.trim().split(" ").pop();
    await sleep(250);
  }
  throw new Error(`no code printed for ${target} in ${LOG}`);
}
const logLines = () => readFileSync(LOG, "utf8").split("\n").length - 1;

// Smallest valid files: a 1x1 PNG and a one-page PDF header (the server sniffs the first bytes).
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const upload = (kind, bytes, name, type) => {
  const f = new FormData();
  f.set("kind", kind);
  f.set("file", new Blob([bytes], { type }), name);
  return f;
};

const mobile = (n) => `9${RUN}${String(n).padStart(3, "0")}`;
const custMobile = mobile(1);
const sellerMobile = mobile(2);
const sellerEmail = `seller${RUN}@example.test`;

const cust = client("customer");
const seller = client("seller");
const admin = client("admin");
const ctx = {};

/* ------------------------------------------------------------- customer */

await step("health: server up and database reachable", async () => {
  const h = await cust.expect(200, "GET", "/api/health");
  assert.equal(h.db, true);
});

await step("customer: sign-in code sent and verified (account created in DB)", async () => {
  const from = logLines();
  await cust.expect(200, "POST", "/api/account/code/send", { identifier: custMobile });
  const code = await codeFor(custMobile, from);
  const bad = await cust.call("POST", "/api/account/code/verify", { identifier: custMobile, code: code === "000000" ? "111111" : "000000" });
  assert.notEqual(bad.status, 200, "a wrong code must be refused");
  const r = await cust.expect(200, "POST", "/api/account/code/verify", { identifier: custMobile, code });
  assert.equal(r.created, true);
  const me = await cust.expect(200, "GET", "/api/account/me");
  ctx.customer = me.customer ?? me.account ?? me;
  assert.ok(JSON.stringify(me).includes(custMobile), "me shows the mobile");
});

await step("customer: profile name saved and read back", async () => {
  await cust.expect(200, "PATCH", "/api/account/profile", { name: "Test Customer" });
  const me = await cust.expect(200, "GET", "/api/account/me");
  assert.ok(JSON.stringify(me).includes("Test Customer"));
});

await step("customer: car saved and read back", async () => {
  const car = { brandSlug: "mahindra", modelSlug: "thar", variant: "LX", year: 2024, label: "Mahindra Thar LX 2024" };
  await cust.expect(200, "PUT", "/api/account/car", { car });
  const me = await cust.expect(200, "GET", "/api/account/me");
  assert.ok(JSON.stringify(me).includes("Mahindra Thar LX 2024"));
});

await step("customer: addresses add / edit / list / delete", async () => {
  const a = { label: "Home", name: "Test Customer", mobile: custMobile, address: "12 MG Road, Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038", isDefault: true };
  const created = await cust.expect(201, "POST", "/api/account/addresses", a);
  const id = created.address?.id;
  assert.ok(id, "address id returned");
  await cust.expect(201, "POST", "/api/account/addresses", { ...a, label: "Office", address: "4th floor, Prestige Tower", isDefault: false });
  await cust.expect(200, "PUT", `/api/account/addresses/${id}`, { ...a, city: "Bangalore" });
  let list = (await cust.expect(200, "GET", "/api/account/addresses")).addresses;
  assert.equal(list.length, 2);
  assert.ok(list.some((x) => x.city === "Bangalore"));
  const office = list.find((x) => x.label === "Office");
  await cust.expect(200, "DELETE", `/api/account/addresses/${office.id}`);
  list = (await cust.expect(200, "GET", "/api/account/addresses")).addresses;
  assert.equal(list.length, 1);
});

await step("customer: cart saved to the account and read back", async () => {
  const lines = [{ id: "vendor:e2e-line", slug: "vendor:e2e-line", href: "/products/e2e-line", name: "Test line", price: 100, qty: 2 }];
  const bad = await cust.call("PUT", "/api/account/cart", { lines: [{ ...lines[0], href: "https://evil.example" }] });
  assert.equal(bad.status, 400, "outside links refused");
  const guest = await client("guest").call("GET", "/api/account/cart");
  assert.equal(guest.status, 401, "guests have no saved cart");
  await cust.expect(200, "PUT", "/api/account/cart", { lines });
  const got = await cust.expect(200, "GET", "/api/account/cart");
  assert.equal(got.lines.length, 1);
  assert.equal(got.lines[0].qty, 2);
  await cust.expect(200, "PUT", "/api/account/cart", { lines: [] });
  assert.equal((await cust.expect(200, "GET", "/api/account/cart")).lines.length, 0);
});

await step("customer: wishlist saved and read back", async () => {
  const item = { slug: "e2e-item", href: "/products/e2e-item", title: "E2E item", brandName: "Test", price: 100, mrp: 120, hasOptions: false, savedAt: Date.now() };
  await cust.expect(200, "PUT", "/api/account/wishlist", { items: [item] });
  const got = await cust.expect(200, "GET", "/api/account/wishlist");
  assert.equal(got.items.length, 1);
});

await step("payments: Razorpay config endpoint answers (enabled only with keys)", async () => {
  const c = await cust.expect(200, "GET", "/api/payments/razorpay/config");
  assert.equal(typeof c.enabled, "boolean");
  ctx.online = c.enabled;
});

/* --------------------------------------------------------------- seller */

await step("seller: sign-up creates a draft account and signs in", async () => {
  await seller.expect(201, "POST", "/api/vendor/auth/signup", {
    fullName: "Test Seller", businessType: "Proprietorship", email: sellerEmail, mobile: sellerMobile, password: "testpass12345", acceptTerms: true,
  });
  const me = await seller.expect(200, "GET", "/api/vendor/me");
  ctx.vendorId = me.vendor.id;
  assert.equal(me.vendor.status, "draft");
});

await step("seller: email and mobile verified by code", async () => {
  for (const [channel, target] of [["email", sellerEmail], ["mobile", sellerMobile]]) {
    const from = logLines();
    await seller.expect(200, "POST", "/api/vendor/auth/otp/send", { channel });
    const code = await codeFor(target, from);
    await seller.expect(200, "POST", "/api/vendor/auth/otp/verify", { channel, code });
  }
  const me = await seller.expect(200, "GET", "/api/vendor/me");
  assert.equal(me.vendor.emailVerified, true);
  assert.equal(me.vendor.mobileVerified, true);
});

await step("seller: onboarding steps saved (tax, store, shipping, bank)", async () => {
  await seller.expect(200, "PUT", "/api/vendor/onboarding/tax", { gstExempt: true, gstin: null, legalName: "Test Seller Traders", tradeName: null, pan: "ABCPE1234F", idType: "PAN", idLast4: "234F" });
  const logo = await seller.expect(201, "POST", "/api/vendor/files", undefined, { form: upload("logo", PNG, "logo.png", "image/png") });
  await seller.expect(200, "PUT", "/api/vendor/onboarding/store", {
    storeName: `E2E Store ${RUN}`, slug: `e2e-store-${RUN}`, sellerType: "Retailer",
    description: "Seat covers and floor mats for popular cars, fitted in Bengaluru.", departments: ["interior"],
    brands: [{ name: "E2E Brand", authType: "Own brand" }], logoFileId: logo.file.id, bannerFileId: null,
  });
  await seller.expect(200, "PUT", "/api/vendor/onboarding/shipping", {
    pickup: { line1: "5 Industrial Area", line2: null, city: "Bengaluru", state: "Karnataka", pincode: "560058" },
    contactPhone: sellerMobile, handlingDays: 2, shipsTo: "pan_india", acceptsReturns: true, returnWindowDays: 7,
  });
  await seller.expect(200, "PUT", "/api/vendor/onboarding/bank", { holderName: "Test Seller", accountNumber: "123456789012", confirmAccountNumber: "123456789012", ifsc: "HDFC0001234" });
});

await step("seller: KYC documents uploaded and application submitted", async () => {
  const pan = await seller.expect(201, "POST", "/api/vendor/files", undefined, { form: upload("doc_pan", PDF, "pan.pdf", "application/pdf") });
  const cheque = await seller.expect(201, "POST", "/api/vendor/files", undefined, { form: upload("doc_cheque", PNG, "cheque.png", "image/png") });
  const bad = await seller.call("POST", "/api/vendor/files", undefined, { form: upload("doc_pan", Buffer.from("<script>"), "x.pdf", "application/pdf") });
  assert.equal(bad.status, 415, "non-PDF bytes refused");
  ctx.docIds = [pan.file.id, cheque.file.id];
  await seller.expect(200, "PUT", "/api/vendor/onboarding/documents", {
    files: [{ kind: "doc_pan", fileId: pan.file.id, name: "pan.pdf" }, { kind: "doc_cheque", fileId: cheque.file.id, name: "cheque.png" }],
    signatoryName: "Test Seller", acceptAgreement: true,
  });
  await seller.expect(200, "POST", "/api/vendor/onboarding/submit");
  const me = await seller.expect(200, "GET", "/api/vendor/me");
  assert.equal(me.vendor.status, "submitted");
});

/* ---------------------------------------------------------------- admin */

await step("admin: application shows in the KYC queue with its documents", async () => {
  const q = await admin.expect(200, "GET", "/api/admin/vendors?status=queue");
  const row = (q.items ?? []).find((v) => v.id === ctx.vendorId);
  assert.ok(row, "new applicant listed in the queue");
  const d = await admin.expect(200, "GET", `/api/admin/vendors/${ctx.vendorId}`);
  const text = JSON.stringify(d);
  for (const id of ctx.docIds) assert.ok(text.includes(id), `document ${id} listed for the admin`);
  const file = await admin.call("GET", `/api/admin/files/${ctx.docIds[0]}`);
  assert.equal(file.status, 200, "admin can open the document");
  assert.ok(file.text.startsWith("%PDF"));
  const stranger = await client("stranger").call("GET", `/api/files/${ctx.docIds[0]}`);
  assert.notEqual(stranger.status, 200, "documents are not public");
});

await step("admin: start review and approve the seller", async () => {
  await admin.expect(200, "POST", `/api/admin/vendors/${ctx.vendorId}/decision`, { action: "start_review" });
  await admin.expect(200, "POST", `/api/admin/vendors/${ctx.vendorId}/decision`, { action: "approve", commissionRate: 10, tier: "standard" });
  const me = await seller.expect(200, "GET", "/api/vendor/me");
  assert.equal(me.vendor.status, "approved");
});

await step("seller: product created, submitted, approved by admin, live", async () => {
  const photo = await seller.expect(201, "POST", "/api/vendor/files", undefined, { form: upload("product_image", PNG, "p.png", "image/png") });
  const p = await seller.expect(201, "POST", "/api/vendor/products", {
    content: {
      title: `E2E Seat Cover ${RUN}`, brand: "E2E Brand", department: "interior", groupSlug: "seat-covers", partType: "aftermarket",
      hsn: "8708", gstRate: 18, warrantyMonths: 6, summary: "Test product", highlights: [], specs: [], fitment: ["universal"], images: [photo.file.id],
    },
    commercial: { sku: `E2E-${RUN}`, mrp: 2000, price: 1500, stock: 10, lowStockAt: 2 },
    submit: true,
  });
  ctx.product = p.product;
  await admin.expect(200, "POST", `/api/admin/vendor-products/${p.product.id}/decision`, { action: "approve" });
  const list = await seller.expect(200, "GET", "/api/vendor/products");
  assert.equal(list.products.find((x) => x.id === p.product.id)?.status, "live");
});

await step("customer: order for the seller's product (WhatsApp) saved to the account", async () => {
  const addr = (await cust.expect(200, "GET", "/api/account/addresses")).addresses[0];
  const r = await cust.expect(201, "POST", "/api/orders", {
    customer: { name: "Test Customer", mobile: custMobile, address: addr.address, city: addr.city, state: addr.state, pincode: addr.pincode },
    lines: [{ id: `vendor:${ctx.product.slug}`, qty: 2, install: false }],
    paymentMethod: "whatsapp",
  });
  ctx.orderNumber = r.order.number;
  assert.ok(r.order.total >= 3000, "server priced the order");
  const mine = await cust.expect(200, "GET", "/api/account/orders");
  assert.ok(JSON.stringify(mine).includes(ctx.orderNumber), "order is in the customer's account");
});

await step("payments: online payment refused cleanly without keys / starts with keys", async () => {
  const addr = (await cust.expect(200, "GET", "/api/account/addresses")).addresses[0];
  const r = await cust.call("POST", "/api/orders", {
    customer: { name: "Test Customer", mobile: custMobile, address: addr.address, city: addr.city, state: addr.state, pincode: addr.pincode },
    lines: [{ id: `vendor:${ctx.product.slug}`, qty: 1, install: false }],
    paymentMethod: "online",
  });
  if (ctx.online) assert.equal(r.status, 201);
  else assert.equal(r.status, 409, `got ${r.status} ${r.text.slice(0, 200)}`);
});

await step("seller: sees the order and moves it accepted → packed → shipped → delivered", async () => {
  const list = await seller.expect(200, "GET", "/api/vendor/orders");
  const o = (list.orders ?? []).find((x) => JSON.stringify(x).includes(ctx.orderNumber));
  assert.ok(o, "order in seller's list");
  ctx.vendorOrderId = o.id;
  await seller.expect(200, "POST", `/api/vendor/orders/${o.id}/status`, { to: "accepted" });
  await seller.expect(200, "POST", `/api/vendor/orders/${o.id}/status`, { to: "packed" });
  await seller.expect(200, "POST", `/api/vendor/orders/${o.id}/status`, { to: "shipped", courier: "Delhivery", trackingNumber: "DLV12345" });
  await seller.expect(200, "POST", `/api/vendor/orders/${o.id}/status`, { to: "delivered" });
});

await step("seller: dashboard stats count the sale", async () => {
  const ov = (await seller.expect(200, "GET", "/api/vendor/overview")).overview;
  assert.ok(JSON.stringify(ov.kpis).includes("3000") || JSON.stringify(ov).includes(ctx.orderNumber), JSON.stringify(ov.kpis).slice(0, 300));
});

await step("admin: reports for all sellers and for one seller (dropdown)", async () => {
  const all = await admin.expect(200, "GET", "/api/admin/reports/sellers");
  const mine = all.sellers.find((s) => s.id === ctx.vendorId);
  assert.ok(mine, "seller in the all-sellers table");
  assert.equal(mine.orders, 1);
  assert.equal(mine.gross, 3000);
  const one = await admin.expect(200, "GET", `/api/admin/reports/sellers?vendor=${ctx.vendorId}`);
  assert.equal(one.sellers.length, 1);
  assert.equal(one.summary.gross, 3000);
  assert.equal(one.summary.delivered, 3000);
  assert.equal(one.daily.length, 1);
  const page = await admin.call("GET", `/admin/reports?vendor=${ctx.vendorId}`);
  assert.equal(page.status, 200);
  assert.ok(page.text.includes(`E2E Store ${RUN}`), "reports page shows the chosen seller");
});

/* ------------------------------------------------------- freeze and reply */

await step("admin: freezes the seller with a message", async () => {
  await admin.expect(200, "POST", `/api/admin/vendors/${ctx.vendorId}/decision`, { action: "suspend", reason: "Frozen for checks: please send your latest GST return." });
  const me = await seller.expect(200, "GET", "/api/vendor/me");
  assert.equal(me.vendor.status, "suspended");
});

await step("seller: frozen account is locked and shows the admin's message", async () => {
  const hold = await seller.expect(200, "GET", "/api/vendor/hold");
  assert.ok(hold.messages.some((m) => m.from === "admin" && m.body.includes("latest GST return")));
  const blocked = await seller.call("POST", "/api/vendor/products", { content: {}, commercial: {}, submit: false });
  assert.equal(blocked.status, 403, "frozen seller cannot change products");
  const page = await seller.call("GET", "/vendor/dashboard");
  assert.equal(page.status, 200);
  assert.ok(page.text.includes("latest GST return"), "dashboard shows the freeze message");
});

await step("seller: replies with a supporting document", async () => {
  const doc = await seller.expect(201, "POST", "/api/vendor/files", undefined, { form: upload("doc_hold_reply", PDF, "gst-return.pdf", "application/pdf") });
  ctx.replyDoc = doc.file.id;
  await seller.expect(201, "POST", "/api/vendor/hold", { body: "Attached is our GST return for October.", fileIds: [doc.file.id] });
  const hold = await seller.expect(200, "GET", "/api/vendor/hold");
  assert.ok(hold.messages.some((m) => m.from === "vendor" && m.files.some((f) => f.id === doc.file.id)));
});

await step("admin: reads the reply and opens the document, answers, lifts the freeze", async () => {
  const d = await admin.expect(200, "GET", `/api/admin/vendors/${ctx.vendorId}/hold`);
  assert.ok(d.messages.some((m) => m.from === "vendor" && m.body.includes("GST return for October")));
  const f = await admin.call("GET", `/api/admin/files/${ctx.replyDoc}`);
  assert.equal(f.status, 200);
  await admin.expect(201, "POST", `/api/admin/vendors/${ctx.vendorId}/hold`, { body: "Thanks, checked. Unfreezing now." });
  const page = await admin.call("GET", `/admin/vendors/${ctx.vendorId}`);
  assert.ok(page.text.includes("GST return for October"), "admin seller page shows the reply");
  await admin.expect(200, "POST", `/api/admin/vendors/${ctx.vendorId}/decision`, { action: "reinstate" });
  const me = await seller.expect(200, "GET", "/api/vendor/me");
  assert.equal(me.vendor.status, "approved");
  const hold = await seller.expect(200, "GET", "/api/vendor/hold");
  assert.ok(hold.messages.some((m) => m.from === "admin" && m.body.includes("Unfreezing")));
});

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log(failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
