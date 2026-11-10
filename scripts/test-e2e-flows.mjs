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
 * reads the reply and the document → admin lifts the freeze; help tickets (customer and seller),
 * coupon, admin cancel with stock back, notifications, bank change, seller payout, rider delivery
 * with the customer's code and rider payout, GST invoice.
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
    const headers = {
      origin: BASE,
      cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
      "user-agent": `e2e-${label}`,
      // Each run looks like a new visitor, so a re-run isn't stopped by the per-IP order limit.
      "x-forwarded-for": `10.88.${Number(RUN) % 250}.${(label.length * 7) % 250 + 1}`,
    };
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
    pickup: { line1: "5 Udyog Vihar, Phase 4", line2: null, city: "Gurugram", state: "Haryana", pincode: "122015" },
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

/* ------------------------------------------------- support, coupons, money */

await step("customer: help ticket saved, admin replies, customer sees the reply", async () => {
  const t = await cust.expect(201, "POST", "/api/support/tickets", { name: "Test Customer", mobile: custMobile, orderNumber: ctx.orderNumber, topic: "order", body: "When will my seat covers arrive? Thanks." });
  const id = t.ticket.id;
  await admin.expect(200, "POST", `/api/admin/customer-tickets/${id}`, { action: "reply", reply: "Your parcel ships tomorrow from Gurugram." });
  const page = await cust.call("GET", "/account/help");
  assert.ok(page.text.includes("Your parcel ships tomorrow"), "customer's help page shows the reply");
});

await step("seller: support ticket saved, admin replies, seller sees the reply", async () => {
  const t = await seller.expect(201, "POST", "/api/vendor/support", { subject: "Payout timing", body: "When is my first payout made after delivery?" });
  const id = t.ticket.id;
  const inbox = await admin.expect(200, "GET", "/api/admin/support");
  assert.ok(JSON.stringify(inbox).includes(id), "ticket in the admin inbox");
  await admin.expect(200, "POST", `/api/admin/support/${id}`, { action: "reply", reply: "Payouts go out every Monday for delivered orders." });
  const mine = await seller.expect(200, "GET", "/api/vendor/support");
  assert.ok(mine.tickets.some((x) => x.id === id && JSON.stringify(x).includes("every Monday")));
});

await step("coupon: admin creates it, checkout applies it, redemption recorded", async () => {
  const code = `E2E${RUN}`;
  await admin.expect(201, "POST", "/api/admin/coupons", { code, title: "E2E flat 200 off", kind: "flat", value: 200, minOrder: 1000, perCustomer: 1, public: false });
  // Coupons apply to Riderzpro's own products; the seller's item rides along so the cancel below can check its stock.
  const lines = [{ id: "7d-luxury-floor-mats", qty: 1, install: false }, { id: `vendor:${ctx.product.slug}`, qty: 1, install: false }];
  const q = await cust.expect(200, "POST", "/api/coupons/check", { code, lines });
  assert.equal(q.quote.discount, 200, JSON.stringify(q.quote));
  const sellerOnly = await cust.call("POST", "/api/coupons/check", { code, lines: lines.slice(1) });
  assert.equal(sellerOnly.status, 409, "not on marketplace items alone");
  const addr = (await cust.expect(200, "GET", "/api/account/addresses")).addresses[0];
  const r = await cust.expect(201, "POST", "/api/orders", {
    customer: { name: "Test Customer", mobile: custMobile, address: addr.address, city: addr.city, state: addr.state, pincode: addr.pincode },
    lines, paymentMethod: "whatsapp", couponCode: code,
  });
  ctx.couponOrder = r.order.number;
  const list = await admin.expect(200, "GET", "/api/admin/coupons");
  const c = list.coupons.find((x) => x.code === code);
  assert.ok(c && JSON.stringify(c).match(/"(used|uses|redemptions|redeemed)":1/), `redemption counted: ${JSON.stringify(c).slice(0, 300)}`);
  const again = await cust.call("POST", "/api/coupons/check", { code, lines, mobile: custMobile });
  assert.notEqual(again.status, 200, "once per customer");
});

await step("admin: cancels the coupon order; stock goes back", async () => {
  const before = (await seller.expect(200, "GET", "/api/vendor/products")).products.find((x) => x.id === ctx.product.id).stock;
  const orders = await admin.expect(200, "GET", `/api/admin/orders?q=${ctx.couponOrder}`);
  const o = (orders.orders ?? orders.items ?? []).find((x) => x.number === ctx.couponOrder);
  assert.ok(o, "order in the admin list");
  const part = (await seller.expect(200, "GET", "/api/vendor/orders")).orders.find((x) => JSON.stringify(x).includes(ctx.couponOrder));
  const early = await admin.call("POST", `/api/admin/orders/${o.id}/order-status`, { to: "cancelled" });
  assert.equal(early.status, 409, "the seller's part must be settled first");
  await admin.expect(200, "POST", `/api/admin/orders/${part.id}/status`, { to: "cancelled", reason: "Customer changed their mind" });
  await admin.expect(200, "POST", `/api/admin/orders/${o.id}/order-status`, { to: "cancelled" });
  const mine = await cust.expect(200, "GET", `/api/account/orders/${ctx.couponOrder}`);
  assert.equal(mine.order.status, "cancelled", "customer sees it cancelled");
  const after = (await seller.expect(200, "GET", "/api/vendor/products")).products.find((x) => x.id === ctx.product.id).stock;
  assert.equal(after, before + 1, "the cancelled unit is back in stock");
});

await step("seller: notifications listed and marked read", async () => {
  const n = await seller.expect(200, "GET", "/api/vendor/notifications");
  const items = n.items ?? n.notifications ?? [];
  assert.ok(items.length > 0, "seller has notifications (approval, orders, freeze)");
  await seller.expect(200, "POST", "/api/vendor/notifications/read", { all: true });
  const after = await seller.expect(200, "GET", "/api/vendor/notifications");
  assert.equal((after.items ?? after.notifications).filter((x) => !x.readAt && !x.read).length, 0);
});

await step("seller: bank change requested, admin approves it", async () => {
  const b = await seller.call("POST", "/api/vendor/settings/bank", { holderName: "Test Seller", accountNumber: "998877665544", confirmAccountNumber: "998877665544", ifsc: "ICIC0004321" });
  assert.ok(b.status === 200 || b.status === 201, `bank change → ${b.status} ${b.text.slice(0, 200)}`);
  const reqs = await admin.expect(200, "GET", "/api/admin/change-requests");
  const r = reqs.items.find((x) => x.vendorId === ctx.vendorId && x.status === "pending") ?? reqs.items.find((x) => JSON.stringify(x).includes(ctx.vendorId));
  assert.ok(r, "request waiting for the admin");
  await admin.expect(200, "POST", `/api/admin/change-requests/${r.id}`, { action: "approve" });
  const d = await admin.expect(200, "GET", `/api/admin/vendors/${ctx.vendorId}`);
  assert.ok(JSON.stringify(d).includes("5544"), "new account's last 4 on the seller record");
});

await step("payouts: a just-delivered order is not payable until the 7-day return window ends", async () => {
  // A payout for real money can't be exercised end to end without waiting 7 days; this checks the
  // rule both ways (not listed, and refused if sent anyway) and that the seller's payouts page answers.
  const due = await admin.expect(200, "GET", "/api/admin/payouts");
  const v = due.vendors.find((x) => x.vendorId === ctx.vendorId);
  assert.ok(!v || !JSON.stringify(v).includes(ctx.vendorOrderId), "not listed as due yet");
  const early = await admin.call("POST", "/api/admin/payouts", { vendorId: ctx.vendorId, vendorOrderIds: [ctx.vendorOrderId], reference: `UTR${RUN}` });
  assert.ok(early.status >= 400 && early.status < 500, `refused: ${early.status} ${early.text.slice(0, 200)}`);
  const mine = await seller.expect(200, "GET", "/api/vendor/payouts");
  assert.ok(JSON.stringify(mine).length > 10);
});

/* ---------------------------------------------------------------- riders */

const rider = client("rider");
const riderMobile = mobile(3);

await step("rider: signs in by code, applies; admin approves", async () => {
  const from = logLines();
  await rider.expect(200, "POST", "/api/rider/code/send", { mobile: riderMobile });
  const code = await codeFor(riderMobile, from);
  await rider.expect(200, "POST", "/api/rider/code/verify", { mobile: riderMobile, code });
  const ap = await rider.call("POST", "/api/rider/apply", { name: "Test Rider", city: "Delhi", vehicleType: "scooter", vehicleNumber: `DL3SAB${RUN.slice(-4)}`, confirmAccurate: true, confirmLicence: true, confirmPrivacy: true });
  assert.ok(ap.status === 200 || ap.status === 201, `apply → ${ap.status} ${ap.text.slice(0, 200)}`);
  const a = ap.json;
  ctx.riderId = a.rider.id;
  await admin.expect(200, "POST", `/api/admin/riders/${ctx.riderId}`, { action: "approve", checked: true });
  await rider.expect(200, "POST", "/api/rider/online", { online: true });
});

await step("rider: delivery job offered, accepted, picked up, delivered with the customer's code; rider paid", async () => {
  const r = await cust.expect(201, "POST", "/api/orders", {
    customer: { name: "Test Customer", mobile: custMobile, address: "22 Connaught Place, Block B", city: "Delhi", state: "Delhi", pincode: "110001" },
    lines: [{ id: `vendor:${ctx.product.slug}`, qty: 1, install: false }], paymentMethod: "whatsapp",
  });
  const vo = (await seller.expect(200, "GET", "/api/vendor/orders")).orders.find((x) => JSON.stringify(x).includes(r.order.number));
  await seller.expect(200, "POST", `/api/vendor/orders/${vo.id}/status`, { to: "accepted" });
  const job = await admin.expect(201, "POST", "/api/admin/rider-jobs", { vendorOrderId: vo.id, riderId: ctx.riderId, earning: 120 });
  const jobId = job.job.id;
  await rider.expect(200, "POST", `/api/rider/jobs/${jobId}`, { action: "accept" });
  const early = await rider.call("POST", `/api/rider/jobs/${jobId}`, { action: "pickup" });
  assert.equal(early.status, 409, "no pickup before the seller packs it");
  await seller.expect(200, "POST", `/api/vendor/orders/${vo.id}/status`, { to: "packed" });
  await rider.expect(200, "POST", `/api/rider/jobs/${jobId}`, { action: "pickup" });
  const detail = await cust.expect(200, "GET", `/api/account/orders/${r.order.number}`);
  const code = JSON.stringify(detail).match(/"code":"(\d{4})"/)?.[1];
  assert.ok(code, "customer sees the 4-digit delivery code");
  const wrong = await rider.call("POST", `/api/rider/jobs/${jobId}`, { action: "deliver", code: code === "0000" ? "1111" : "0000" });
  assert.notEqual(wrong.status, 200, "wrong code refused");
  await rider.expect(200, "POST", `/api/rider/jobs/${jobId}`, { action: "deliver", code });
  const sold = (await seller.expect(200, "GET", "/api/vendor/orders")).orders.find((x) => x.id === vo.id);
  assert.equal(sold.status, "delivered", "the seller's order is delivered too");
  const pay = await admin.expect(201, "POST", "/api/admin/rider-payouts", { riderId: ctx.riderId, reference: `UPI${RUN}` });
  assert.equal(pay.payout.amount, 120);
  ctx.riderOrder = r.order.number;
});

await step("customer: GST invoice for the delivered order", async () => {
  const inv = await cust.call("GET", `/account/orders/${ctx.orderNumber}/invoice`);
  assert.equal(inv.status, 200);
  assert.ok(/invoice/i.test(inv.text) && inv.text.includes(ctx.orderNumber));
});

/* ------------------------------------------------------ catalogue (database) */

const HOUSE = "nappa-leather-steering-cover";
// Each catalogue order uses its own mobile (orders are limited to 5 per mobile per hour).
let houseSeq = 10;
const houseOrder = (qty) => cust.call("POST", "/api/orders", {
  customer: { name: "Test Customer", mobile: mobile(houseSeq++), address: "12 MG Road, Indiranagar", city: "Bengaluru", state: "Karnataka", pincode: "560038" },
  lines: [{ id: HOUSE, qty, install: false }], paymentMethod: "whatsapp",
});

await step("catalogue: products come from the database; admin price change shows on the site", async () => {
  const list = await admin.expect(200, "GET", `/api/admin/products?q=${HOUSE}`);
  const row = list.rows.find((r) => r.slug === HOUSE);
  assert.ok(row, "house product is a database row");
  ctx.house = row;
  const price = 777 + (Number(RUN) % 100);
  await admin.expect(200, "PUT", `/api/admin/products/${HOUSE}`, { price, mrp: row.mrp, stock: 2, status: "live" });
  await sleep(1100); // other server processes see a change within a second (src/lib/server/catalog.ts)
  const page = await cust.call("GET", `/products/${HOUSE}`);
  assert.ok(page.text.includes(`₹${price}`) || page.text.includes(String(price)), "product page shows the new price");
  const search = await cust.expect(200, "GET", "/search-index.json");
  assert.ok(JSON.stringify(search).includes(String(price)), "search shows the new price");
  ctx.housePrice = price;
});

await step("catalogue: orders take counted stock; sold out is refused; a cancel puts it back", async () => {
  const r = await houseOrder(2);
  assert.equal(r.status, 201, r.text.slice(0, 200));
  assert.equal(r.json.order.total, ctx.housePrice * 2 + (ctx.housePrice * 2 >= 2000 ? 0 : 149), "server priced it from the database");
  let row = (await admin.expect(200, "GET", `/api/admin/products?q=${HOUSE}`)).rows[0];
  assert.equal(row.stock, 0, "2 − 2 = 0");
  const page = await cust.call("GET", `/products/${HOUSE}`);
  assert.ok(page.text.includes("Out of stock"), "product page says out of stock");
  const more = await houseOrder(1);
  assert.equal(more.status, 400, "can't order a sold-out product");
  const orders = await admin.expect(200, "GET", `/api/admin/orders?q=${r.json.order.number}`);
  const o = (orders.orders ?? orders.items).find((x) => x.number === r.json.order.number);
  await admin.expect(200, "POST", `/api/admin/orders/${o.id}/order-status`, { to: "cancelled" });
  row = (await admin.expect(200, "GET", `/api/admin/products?q=${HOUSE}`)).rows[0];
  assert.equal(row.stock, 2, "cancelled order's stock is back");
});

await step("catalogue: hidden products leave the shop and their page; restored afterwards", async () => {
  await admin.expect(200, "PUT", `/api/admin/products/${HOUSE}`, { price: ctx.house.price, mrp: ctx.house.mrp, stock: ctx.house.stock, status: "hidden" });
  await sleep(1100);
  assert.equal((await cust.call("GET", `/products/${HOUSE}`)).status, 404);
  const search = await cust.expect(200, "GET", "/search-index.json");
  assert.ok(!JSON.stringify(search).includes(`/products/${HOUSE}"`), "not in search");
  assert.equal((await houseOrder(1)).status, 400, "can't be ordered");
  await admin.expect(200, "PUT", `/api/admin/products/${HOUSE}`, { price: ctx.house.price, mrp: ctx.house.mrp, stock: ctx.house.stock, status: "live" });
  await sleep(1100);
  assert.equal((await cust.call("GET", `/products/${HOUSE}`)).status, 200);
  const bad = await admin.call("PUT", `/api/admin/products/${HOUSE}`, { price: 5000, mrp: 100, stock: null, status: "live" });
  assert.equal(bad.status, 400, "price above MRP refused");
});

/* ---------------------------------------------------------------- reviews */

await step("reviews: only delivered orders can be reviewed, once; nothing shows before approval", async () => {
  const page = await cust.call("GET", `/account/orders/${ctx.orderNumber}`);
  assert.ok(page.text.includes("Review your order"), "delivered order offers a review");
  const body = `Seat covers fitted perfectly, run ${RUN}. Delivery was quick.`;
  await cust.expect(201, "POST", "/api/account/reviews", { orderNumber: ctx.orderNumber, productSlug: null, rating: 5, title: "Great fit", body, name: "Test Customer", city: "Bengaluru", vehicle: "Mahindra Thar" });
  const again = await cust.call("POST", "/api/account/reviews", { orderNumber: ctx.orderNumber, productSlug: null, rating: 5, body, name: "Test Customer" });
  assert.equal(again.status, 409, "one review per order");
  const notMine = await client("stranger2").call("POST", "/api/account/reviews", { orderNumber: ctx.orderNumber, productSlug: null, rating: 1, body: "never bought anything here", name: "Fake" });
  assert.equal(notMine.status, 401, "signed-in customers only");
  const home = await cust.call("GET", "/");
  assert.ok(!home.text.includes(`run ${RUN}`), "not on the site before approval");
  ctx.reviewBody = body;
});

await step("reviews: a Riderzpro product review after the order is completed; ratings follow approvals", async () => {
  const r = await houseOrder(1);
  assert.equal(r.status, 201, r.text.slice(0, 200));
  const number = r.json.order.number;
  // The order was placed on another mobile; it still joins the signed-in account.
  const early = await cust.call("POST", "/api/account/reviews", { orderNumber: number, productSlug: HOUSE, rating: 4, body: "Good leather, stitching is neat.", name: "Test Customer" });
  assert.equal(early.status, 409, "not before the order is completed");
  const o = (await admin.expect(200, "GET", `/api/admin/orders?q=${number}`)).orders.find((x) => x.number === number);
  await admin.expect(200, "POST", `/api/admin/orders/${o.id}/order-status`, { to: "confirmed" });
  await admin.expect(200, "POST", `/api/admin/orders/${o.id}/order-status`, { to: "completed" });
  await cust.expect(201, "POST", "/api/account/reviews", { orderNumber: number, productSlug: HOUSE, rating: 4, title: "Neat stitching", body: `Good leather, stitching is neat. ${RUN}`, name: "Test Customer" });

  const pending = await admin.expect(200, "GET", "/api/admin/reviews?status=pending");
  const mine = pending.items.filter((x) => x.body.includes(RUN));
  assert.equal(mine.length, 2, "both reviews wait for the admin");
  for (const m of mine) await admin.expect(200, "POST", `/api/admin/reviews/${m.id}`, { action: "approve" });
  await sleep(1100);

  const home = await cust.call("GET", "/");
  assert.ok(home.text.includes(`run ${RUN}`), "approved review on the home page");
  const product = await cust.call("GET", `/products/${HOUSE}`);
  assert.ok(product.text.includes("Customer reviews"), "product page lists its reviews");
  assert.ok(product.text.includes("aggregateRating"), "rating offered to search engines");
  const why = await cust.call("GET", "/why-riderzpro");
  assert.ok(why.text.includes("Average rating"), "site stats include the real average rating");
});

/* ---------------------------------------------------- cars and builds (database) */

const adminUpload = (kind) => admin.expect(201, "POST", "/api/admin/uploads", undefined, { form: upload(kind, PNG, "photo.png", "image/png") });

await step("cars: no sample cars; a draft is private, live is for sale with its photo, sold shows sold", async () => {
  const shop = await cust.call("GET", "/cars");
  assert.equal(shop.status, 200);
  assert.ok(!shop.text.includes("2022-mahindra-thar-lx-4x4-hard-top"), "the old sample cars are gone");
  const photo = await adminUpload("car_photo");
  const car = {
    status: "draft", make: "Mahindra", model: "Thar", variant: `LX ${RUN}`, year: 2022, price: 1575000, km: 32000, fuel: "Diesel", transmission: "Manual",
    owners: 1, city: "Bengaluru", state: "Karnataka", body: "Off-Roader", engine: "2.2L mHawk", power: null, drivetrain: "4WD", colour: "Red",
    registration: "KA-03", insurance: null, serviceHistory: "Full dealer history", note: "One owner, never off-roaded hard, all papers in order.",
    highlights: ["New tyres"], modifications: [], photoIds: [photo.file.id], financing: true, featured: false,
  };
  const noPhoto = await admin.call("POST", "/api/admin/cars", { ...car, status: "live", photoIds: [] });
  assert.equal(noPhoto.status, 400, "live needs a photo");
  const created = (await admin.expect(201, "POST", "/api/admin/cars", car)).car;
  assert.equal((await cust.call("GET", `/cars/${created.slug}`)).status, 404, "draft not public");
  assert.notEqual((await cust.call("GET", `/api/files/${photo.file.id}`)).status, 200, "draft photo not public");
  await admin.expect(200, "PUT", `/api/admin/cars/${created.id}`, { ...car, status: "live" });
  await sleep(1100);
  const page = await cust.call("GET", `/cars/${created.slug}`);
  assert.equal(page.status, 200);
  assert.ok(page.text.includes(`LX ${RUN}`), "car page shows it");
  assert.equal((await cust.call("GET", `/api/files/${photo.file.id}`)).status, 200, "photo public once live");
  assert.ok((await cust.call("GET", "/cars")).text.includes(created.slug), "listed on /cars");
  assert.ok(JSON.stringify(await cust.expect(200, "GET", "/search-index.json")).includes(created.slug), "in search");
  await admin.expect(200, "PUT", `/api/admin/cars/${created.id}`, { ...car, status: "sold" });
  await sleep(1100);
  const sold = await cust.call("GET", `/cars/${created.slug}`);
  assert.ok(sold.text.includes("This car has been sold"), "sold car says so");
  assert.ok(!(await cust.call("GET", "/cars")).text.includes(created.slug), "not browsable once sold");
  await admin.expect(200, "PUT", `/api/admin/cars/${created.id}`, { ...car, status: "archived" });
});

await step("builds: no sample builds; a live build shows with its photo", async () => {
  const before = await cust.call("GET", "/builds");
  assert.ok(!before.text.includes("PROJECT DUST"), "the old sample builds are gone");
  const photo = await adminUpload("build_photo");
  const build = { status: "live", title: `Trail ${RUN}`, vehicle: "2023 Mahindra Thar", owner: null, city: "Bengaluru", cost: 250000, weeks: 3,
    brief: "Lift, lights and recovery gear for weekend trails.", tag: "Off-Road", mods: [{ group: "Suspension", items: ["2-inch lift"] }], shop: [HOUSE], photoIds: [photo.file.id] };
  const created = (await admin.expect(201, "POST", "/api/admin/builds", build)).build;
  await sleep(200);
  const page = await cust.call("GET", `/builds/${created.slug}`);
  assert.equal(page.status, 200);
  assert.ok(page.text.includes(`Trail ${RUN}`.toUpperCase()) || page.text.includes(`Trail ${RUN}`));
  assert.ok((await cust.call("GET", "/off-road")).text.includes(created.slug), "off-road page lists it");
  await admin.expect(200, "PUT", `/api/admin/builds/${created.id}`, { ...build, status: "archived" });
  assert.equal((await cust.call("GET", `/builds/${created.slug}`)).status, 404, "archived build is gone");
});

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log(failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
