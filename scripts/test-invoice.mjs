#!/usr/bin/env node
/**
 * Checks for customer invoices and order messages (Phase 4b).
 *
 *   node scripts/test-invoice.mjs
 *
 * Needs Node 24+ (built-in TypeScript type stripping). Runs on a fresh embedded database in a temp
 * folder (never .data/pglite, so the dev server can keep running), with every provider key removed
 * and `fetch` replaced by a recorder: nothing is ever sent.
 *
 *   1. GST maths: within a state (CGST + SGST, odd rupee to SGST), across states (IGST), 0% lines,
 *      totals equal the GST-inclusive amounts
 *   2. amount in words (Indian numbering), financial year in India time
 *   3. invoice numbers: per financial year, across the 31 March / 1 April boundary, gap-free after
 *      a rollback, never shared by concurrent issues; one invoice per order (idempotent)
 *   4. order confirmation email + SMS go out once (console provider), failed sends retry, a missing
 *      MSG91 template skips the SMS
 *   5. sign-in codes (otp.ts) unchanged: console code, send + verify, and the provider requests have
 *      the same shape as before the refactor
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The app uses TypeScript parameter properties (e.g. ApiError), which need type transformation.
if (!process.execArgv.includes("--experimental-transform-types")) {
  const r = spawnSync(process.execPath, ["--experimental-transform-types", "--no-warnings", ...process.execArgv, ...process.argv.slice(1)], {
    stdio: "inherit",
  });
  process.exit(r.status ?? 1);
}

register("./test-invoice-loader.mjs", import.meta.url);

/* ---- safety: no keys, no network ---- */
for (const k of Object.keys(process.env)) {
  if (/^(RESEND_|MSG91_|TWILIO_|OTP_|ORDERS_EMAIL|DATABASE_URL|NEXT_PUBLIC_SITE_URL)/.test(k)) delete process.env[k];
}
process.env.NODE_ENV = "development";
const sent = [];
let fetchAnswer = () => new Response(JSON.stringify({ id: "fake_1", message: "req_1", sid: "SM1", request_id: "otp_1" }), { status: 200 });
globalThis.fetch = async (url, init = {}) => {
  sent.push({ url: String(url), init });
  return fetchAnswer();
};

const dir = mkdtempSync(join(tmpdir(), "rzp-invoice-test-"));
process.chdir(dir);

/* ---- console capture ---- */
const logs = [];
for (const level of ["info", "warn", "error"]) {
  const orig = console[level].bind(console);
  console[level] = (...a) => {
    logs.push(a.map(String).join(" "));
    if (process.env.VERBOSE) orig(...a);
  };
}

let passed = 0;
async function check(name, fn) {
  try {
    await fn();
    passed++;
    process.stdout.write(`  ok  ${name}\n`);
  } catch (err) {
    process.stdout.write(`  FAIL ${name}\n`);
    throw err;
  }
}

try {
  const gst = await import("@/lib/invoice/gst");
  const db = await import("@/lib/db/client");
  const inv = await import("@/lib/server/customer-invoice");
  const msg = await import("@/lib/server/messaging");
  const mail = await import("@/lib/server/order-emails");
  const otp = await import("@/lib/server/otp");

  console.log = (...a) => process.stdout.write(a.join(" ") + "\n");
  process.stdout.write("1. GST maths\n");

  const line = (unitPrice, gstRate, qty = 1, kind = "goods") => ({ kind, title: "x", variant: null, qty, unitPrice, hsn: "8708", gstRate });

  await check("intra-state: 1000 at 18% → 847 + CGST 76 + SGST 77 (odd rupee to SGST)", () => {
    const r = gst.computeInvoice([line(1000, 18)], { supplierState: "Karnataka", buyerState: "karnataka " });
    assert.equal(r.intraState, true);
    assert.deepEqual([r.lines[0].taxable, r.lines[0].cgst, r.lines[0].sgst, r.lines[0].igst], [847, 76, 77, 0]);
  });
  await check("inter-state: 1000 at 18% → 847 + IGST 153", () => {
    const r = gst.computeInvoice([line(1000, 18)], { supplierState: "Karnataka", buyerState: "Delhi" });
    assert.equal(r.intraState, false);
    assert.deepEqual([r.lines[0].taxable, r.lines[0].cgst, r.lines[0].sgst, r.lines[0].igst], [847, 0, 0, 153]);
  });
  await check("0% (exempt) line: no tax, taxable = amount", () => {
    const r = gst.computeInvoice([line(500, 0, 2)], { supplierState: "Karnataka", buyerState: "Karnataka" });
    assert.deepEqual([r.lines[0].taxable, r.lines[0].cgst, r.lines[0].sgst, r.lines[0].amount], [1000, 0, 0, 1000]);
  });
  await check("rounding: every line and the totals add up exactly (many prices, 0/5/12/18/28%)", () => {
    for (const intra of [true, false]) {
      const lines = [];
      for (let p = 1; p <= 3000; p += 37) lines.push(line(p, [0, 5, 12, 18, 28][p % 5], (p % 3) + 1));
      const r = gst.computeInvoice(lines, { supplierState: "Karnataka", buyerState: intra ? "Karnataka" : "Kerala" });
      for (const l of r.lines) {
        assert.equal(l.taxable + l.cgst + l.sgst + l.igst, l.amount);
        assert.ok(l.cgst <= l.sgst && l.sgst - l.cgst <= 1);
        assert.equal(l.amount, l.rate * l.qty);
      }
      assert.equal(r.totals.taxable + r.totals.cgst + r.totals.sgst + r.totals.igst, r.totals.amount);
      assert.equal(r.totals.amount, lines.reduce((n, l) => n + l.unitPrice * l.qty, 0));
      const byRate = gst.taxByRate(r.lines);
      assert.equal(byRate.reduce((n, x) => n + x.amount, 0), r.totals.amount);
    }
  });

  process.stdout.write("2. Words and financial year\n");
  await check("amount in words, Indian numbering", () => {
    assert.equal(gst.rupeesInWords(0), "Rupees Zero Only");
    assert.equal(gst.rupeesInWords(1), "Rupees One Only");
    assert.equal(gst.rupeesInWords(118), "Rupees One Hundred Eighteen Only");
    assert.equal(gst.rupeesInWords(4999), "Rupees Four Thousand Nine Hundred Ninety-Nine Only");
    assert.equal(gst.rupeesInWords(124900), "Rupees One Lakh Twenty-Four Thousand Nine Hundred Only");
    assert.equal(gst.rupeesInWords(1000005), "Rupees Ten Lakh Five Only");
    assert.equal(gst.rupeesInWords(123456789), "Rupees Twelve Crore Thirty-Four Lakh Fifty-Six Thousand Seven Hundred Eighty-Nine Only");
  });
  await check("financial year turns at midnight 1 April, India time", () => {
    assert.equal(gst.financialYear(new Date("2027-03-31T18:29:59Z")), "2026-27");
    assert.equal(gst.financialYear(new Date("2027-03-31T18:30:00Z")), "2027-28");
    assert.equal(gst.financialYear(new Date("2026-01-15T10:00:00Z")), "2025-26");
    assert.equal(gst.financialYear(new Date("2099-12-31T10:00:00Z")), "2099-00");
    assert.equal(gst.formatInvoiceNumber("2026-27", 1), "RZP/2026-27/00001");
  });

  process.stdout.write("3. Invoice numbers (fresh embedded database)\n");
  let n = 0;
  const mkOrder = async ({ state = "Karnataka", shipping = 99, house = [[1000, 0]], vendorItems = [], status = "confirmed", email = "buyer@example.test" } = {}) => {
    n++;
    const id = `ord_test${n}`;
    const merch = [...house.map(([p, i]) => p + i), ...vendorItems].reduce((a, b) => a + b, 0);
    await db.sql(
      `INSERT INTO orders (id, number, status, customer_name, customer_phone, customer_email, address, city, state, pincode, subtotal, shipping, total)
       VALUES ($1,$2,$3,'Ravi Kumar','9123456780',$4,'12 MG Road','Bengaluru',$5,'560001',$6,$7,$8)`,
      [id, `RZP-T${String(n).padStart(5, "0")}`, status, email, state, merch, shipping, merch + shipping],
    );
    let k = 0;
    for (const [price, install] of house) {
      await db.sql(
        `INSERT INTO order_items (id, order_id, product_kind, product_ref, title, unit_price, install_price, qty, line_total)
         VALUES ($1,$2,'house','unknown-product','Seat covers',$3,$4,1,$5)`,
        [`itm_${id}_${k++}`, id, price, install, price + install],
      );
    }
    if (vendorItems.length) {
      await db.sql(
        `INSERT INTO vendors (id, email, mobile, password_hash, full_name, business_type, status, store_name)
         VALUES ('ven_t','s@example.test','9000000000','x','Seller','company','approved','Indus Enterprises') ON CONFLICT DO NOTHING`,
      );
      await db.sql("INSERT INTO vendor_orders (id, order_id, vendor_id, subtotal, commission_rate) VALUES ($1,$2,'ven_t',$3,10)", [
        `vor_${id}`, id, vendorItems.reduce((a, b) => a + b, 0),
      ]);
      for (const price of vendorItems) {
        await db.sql(
          `INSERT INTO order_items (id, order_id, vendor_order_id, product_kind, product_ref, title, unit_price, qty, line_total)
           VALUES ($1,$2,$3,'vendor','vp_x','Dashcam',$4,1,$4)`,
          [`itm_${id}_${k++}`, id, `vor_${id}`, price],
        );
      }
    }
    return id;
  };

  const mar31 = new Date("2027-03-31T18:00:00Z"); // 23:30 IST, 31 March 2027
  const apr1 = new Date("2027-03-31T18:31:00Z"); // 00:01 IST, 1 April 2027

  await check("first invoice of a year is 00001; the next year starts again", async () => {
    const a = await inv.issueCustomerInvoice(await mkOrder(), { at: mar31 });
    const b = await inv.issueCustomerInvoice(await mkOrder(), { at: mar31 });
    const c = await inv.issueCustomerInvoice(await mkOrder(), { at: apr1 });
    assert.equal(a.number, "RZP/2026-27/00001");
    assert.equal(b.number, "RZP/2026-27/00002");
    assert.equal(c.number, "RZP/2027-28/00001");
  });

  await check("issuing twice answers the same invoice (one per order)", async () => {
    const id = await mkOrder();
    const a = await inv.issueCustomerInvoice(id, { at: apr1 });
    const b = await inv.issueCustomerInvoice(id, { at: apr1 });
    const [same1, same2] = await Promise.all([inv.issueCustomerInvoice(id), inv.issueCustomerInvoice(id)]);
    assert.equal(a.number, "RZP/2027-28/00002");
    for (const x of [b, same1, same2]) assert.equal(x.number, a.number);
    const rows = await db.sql("SELECT count(*)::int AS c FROM customer_invoices WHERE order_id = $1", [id]);
    assert.equal(rows[0].c, 1);
  });

  await check("a rolled-back allocation leaves no gap", async () => {
    await assert.rejects(
      db.transaction(async (q) => {
        await inv.allocateInvoiceNumber(q, apr1);
        throw new Error("boom");
      }),
      /boom/,
    );
    const x = await inv.issueCustomerInvoice(await mkOrder(), { at: apr1 });
    assert.equal(x.number, "RZP/2027-28/00003");
  });

  await check("20 concurrent issues: 20 distinct, consecutive numbers", async () => {
    const ids = [];
    for (let i = 0; i < 20; i++) ids.push(await mkOrder());
    const out = await Promise.all(ids.map((id) => inv.issueCustomerInvoice(id, { at: apr1 })));
    const seqs = out.map((o) => Number(o.number.split("/")[2])).sort((a, b) => a - b);
    assert.equal(new Set(seqs).size, 20);
    assert.deepEqual(seqs, Array.from({ length: 20 }, (_, i) => i + 4));
  });

  await check("snapshot: house goods + installation + delivery; seller items listed outside the totals", async () => {
    const id = await mkOrder({ state: "Delhi", shipping: 99, house: [[2360, 590]], vendorItems: [4999] });
    const x = await inv.issueCustomerInvoice(id, { at: apr1 });
    const s = x.snapshot;
    assert.equal(s.intraState, false);
    assert.deepEqual(s.placeOfSupply, { state: "Delhi", code: "07" });
    assert.deepEqual(s.lines.map((l) => [l.kind, l.hsn, l.amount]), [["goods", "8708", 2360], ["installation", "998714", 590], ["delivery", "996812", 99]]);
    assert.equal(s.totals.amount, 2360 + 590 + 99);
    assert.equal(s.lines[0].igst, 360);
    assert.equal(s.order.total, 2360 + 590 + 99 + 4999);
    assert.deepEqual(s.sellerItems, [{ title: "Dashcam", variant: null, qty: 1, amount: 4999, seller: "Indus Enterprises" }]);
    assert.equal(s.supplier.gstin, "29AAJCM4412Q1ZP");
    assert.equal(s.supplier.state, "Karnataka");
    assert.equal(s.amountInWords, "Rupees Three Thousand Forty-Nine Only");
    // Reprint reads the frozen copy.
    const again = await inv.adminInvoiceFor(id);
    assert.equal(again.state, "issued");
    assert.deepEqual(again.invoice.snapshot, s);
  });

  await check("no invoice for: seller-only order with free delivery, cancelled order; placed order is pending", async () => {
    const counter = async () => (await db.sql("SELECT coalesce(sum(last_no), 0)::int AS n FROM invoice_series"))[0].n;
    const before = await counter();
    assert.equal(await inv.issueCustomerInvoice(await mkOrder({ house: [], shipping: 0, vendorItems: [999] })), null);
    assert.equal(await inv.issueCustomerInvoice(await mkOrder({ status: "cancelled" })), null);
    const placed = await mkOrder({ status: "placed" });
    assert.equal((await inv.adminInvoiceFor(placed)).state, "pending");
    assert.equal(await counter(), before, "no number was taken for orders without an invoice");
  });

  await check("a confirmed order without an invoice gets one on first view (customer must own it)", async () => {
    const id = await mkOrder();
    await db.sql("INSERT INTO customers (id, name, mobile) VALUES ('cus_a','A','9111111111'), ('cus_b','B','9222222222')");
    await db.sql("UPDATE orders SET customer_id = 'cus_a' WHERE id = $1", [id]);
    const number = (await db.sql("SELECT number FROM orders WHERE id = $1", [id]))[0].number;
    assert.equal(await inv.customerInvoiceFor("cus_b", number), null);
    const mine = await inv.customerInvoiceFor("cus_a", number);
    assert.equal(mine.state, "issued");
    assert.match(mine.invoice.number, new RegExp(`^RZP/${gst.financialYear(new Date())}/\\d{5}$`));
  });

  process.stdout.write("4. Order messages (console provider)\n");
  await check("onOrderConfirmedMessages: invoice + email + SMS once; repeats send nothing", async () => {
    const id = await mkOrder();
    logs.length = 0;
    const first = await mail.onOrderConfirmedMessages(id);
    const second = await mail.onOrderConfirmedMessages(id);
    assert.match(first.invoice, /^RZP\//);
    assert.equal(second.invoice, first.invoice);
    assert.equal(first.email.status, "dev");
    assert.equal(first.sms.status, "dev");
    assert.equal(second.email.status, "dev");
    assert.equal(second.email.repeat, true);
    assert.equal(second.sms.repeat, true);
    assert.equal(logs.filter((l) => l.startsWith("[mail:dev]")).length, 1);
    const smsLines = logs.filter((l) => l.startsWith("[sms:dev]"));
    assert.equal(smsLines.length, 1);
    const number = (await db.sql("SELECT number FROM orders WHERE id = $1", [id]))[0].number;
    assert.ok(smsLines[0].includes(`Thanks! Riderzpro order ${number} for Rs 1099 is confirmed. Track: riderzpro.com/account/orders`));
    const mailLine = logs.find((l) => l.startsWith("[mail:dev]"));
    assert.ok(mailLine.includes(`https://riderzpro.com/account/orders/${number}/invoice`));
    assert.ok(mailLine.includes(first.invoice));
    assert.equal(sent.length, 0, "nothing reached the network");
    const log = await db.sql("SELECT kind, channel, status FROM message_log WHERE order_id = $1 ORDER BY kind", [id]);
    assert.deepEqual(log.map((r) => [r.kind, r.channel, r.status]), [["order_confirmation", "email", "dev"], ["order_confirmed", "sms", "dev"]]);
  });

  await check("email HTML escapes customer text; no email address → skipped", async () => {
    const o = { id: "x", number: "RZP-ABC123", status: "confirmed", customer_name: "<b>Ravi</b>", customer_phone: "9123456780", customer_email: null, account_email: null, address: "1 <script>", city: "B", state: "Karnataka", pincode: "560001", subtotal: 100, shipping: 0, total: 100, created_at: new Date() };
    const m = mail.confirmationEmail(o, [{ title: "A & B", variant: null, qty: 1, unit_price: 100, install_price: 0, line_total: 100, seller: null }], null);
    assert.ok(!m.html.includes("<script>") && !m.html.includes("<b>Ravi"));
    assert.ok(m.html.includes("A &amp; B"));
    const id = await mkOrder({ email: null });
    assert.equal((await mail.sendOrderConfirmation(id)).reason, "no_email");
  });

  await check("a failed send is tried again; a sent one is not", async () => {
    process.env.OTP_SEND_IN_DEV = "true";
    process.env.RESEND_API_KEY = "re_test_fake";
    process.env.ORDERS_EMAIL_FROM = "Riderzpro Orders <orders@example.test>";
    try {
      const id = await mkOrder();
      fetchAnswer = () => new Response("{}", { status: 500 });
      sent.length = 0;
      assert.equal((await mail.sendOrderConfirmation(id)).status, "failed");
      fetchAnswer = () => new Response(JSON.stringify({ id: "email_123" }), { status: 200 });
      const ok2 = await mail.sendOrderConfirmation(id);
      assert.deepEqual([ok2.status, ok2.providerId], ["sent", "email_123"]);
      assert.equal((await mail.sendOrderConfirmation(id)).repeat, true);
      assert.equal(sent.length, 2);
      const body = JSON.parse(sent[1].init.body);
      assert.equal(sent[1].url, "https://api.resend.com/emails");
      assert.deepEqual(body.to, ["buyer@example.test"]);
      assert.equal(body.from, "Riderzpro Orders <orders@example.test>");
      assert.ok(body.html && body.text);
      assert.ok(!logs.some((l) => l.includes("re_test_fake")), "the key never reaches the logs");
      const row = (await db.sql("SELECT status, provider_id, attempts FROM message_log WHERE order_id = $1", [id]))[0];
      assert.deepEqual([row.status, row.provider_id, row.attempts], ["sent", "email_123", 2]);
    } finally {
      for (const k of ["OTP_SEND_IN_DEV", "RESEND_API_KEY", "ORDERS_EMAIL_FROM"]) delete process.env[k];
      fetchAnswer = () => new Response(JSON.stringify({ id: "fake_1" }), { status: 200 });
    }
  });

  await check("MSG91 without a template id skips the SMS with a note; with one it uses the Flow API", async () => {
    process.env.OTP_SEND_IN_DEV = "true";
    process.env.MSG91_AUTH_KEY = "msg91_fake";
    try {
      sent.length = 0;
      logs.length = 0;
      const r = await msg.sendTemplateSms("rider_arriving", "+91 91234 56780", ["RZP-ABC123", "7", "4821"]);
      assert.deepEqual([r.status, r.reason], ["skipped", "no_template"]);
      assert.ok(logs.some((l) => l.includes("no MSG91 template id for rider_arriving")));
      assert.equal(sent.length, 0);
      process.env.MSG91_TEMPLATE_RIDER_ARRIVING = "tmpl_arriving";
      fetchAnswer = () => new Response(JSON.stringify({ type: "success", message: "req_9" }), { status: 200 });
      const r2 = await msg.sendTemplateSms("rider_arriving", "9123456780", ["RZP-ABC123", "7", "4821"]);
      assert.deepEqual([r2.status, r2.providerId], ["sent", "req_9"]);
      assert.equal(sent[0].url, "https://control.msg91.com/api/v5/flow");
      assert.deepEqual(JSON.parse(sent[0].init.body), {
        template_id: "tmpl_arriving",
        short_url: "0",
        recipients: [{ mobiles: "919123456780", var1: "RZP-ABC123", var2: "7", var3: "4821" }],
      });
    } finally {
      for (const k of ["OTP_SEND_IN_DEV", "MSG91_AUTH_KEY", "MSG91_TEMPLATE_RIDER_ARRIVING"]) delete process.env[k];
    }
  });

  await check("template texts (docs/team/Amrutha_work.md)", () => {
    assert.equal(msg.fillTemplate("rider_arriving", ["RZP-ABC123", "7", "4821"]), "Your Riderzpro order RZP-ABC123 is arriving in about 7 minutes. Delivery code: 4821.");
    assert.equal(msg.fillTemplate("rider_arrived", ["RZP-ABC123", "4821"]), "Your Riderzpro rider has arrived with order RZP-ABC123. Share code 4821 only after you get the parcel.");
    assert.equal(msg.fillTemplate("rider_offer", ["Gurugram"]), "New Riderzpro delivery near Gurugram. Open the rider app to accept.");
  });

  await check("rider alerts: unknown job is skipped without sending", async () => {
    assert.equal((await msg.smsRiderArriving("job_nope", { minutes: 5 })).reason, "no_job");
    assert.equal((await msg.smsRiderArrived("job_nope")).reason, "no_job");
    assert.equal((await msg.smsRiderOffer("job_nope")).reason, "no_job");
  });

  await check("rider alerts on a real job: customer gets arriving/arrived with the code, rider gets the offer, each once", async () => {
    const id = await mkOrder({ state: "Delhi" });
    await db.sql(
      `INSERT INTO riders (id, mobile, name, city, vehicle_type, status, consent_version, consented_at)
       VALUES ('rdr_t','9811111111','Saroj','Gurugram','bicycle','approved','v1',now())`,
    );
    await db.sql(
      `INSERT INTO rider_jobs (id, order_id, rider_id, pickup_name, pickup_address, drop_name, drop_address, drop_phone, city, earning, delivery_code, created_by)
       VALUES ('job_t',$1,'rdr_t','Riderzpro','Hub','Ravi','12 MG Road','9123456780','Gurugram',60,'4821','admin')`,
      [id],
    );
    const number = (await db.sql("SELECT number FROM orders WHERE id = $1", [id]))[0].number;
    logs.length = 0;
    assert.equal((await msg.smsRiderArriving("job_t", { minutes: 6.6 })).status, "dev");
    assert.equal((await msg.smsRiderArriving("job_t", { minutes: 3 })).repeat, true);
    assert.equal((await msg.smsRiderArrived("job_t")).status, "dev");
    assert.equal((await msg.smsRiderOffer("job_t")).status, "dev");
    const lines = logs.filter((l) => l.startsWith("[sms:dev]"));
    assert.deepEqual(lines, [
      `[sms:dev] to 9123456780 (rider_arriving): Your Riderzpro order ${number} is arriving in about 7 minutes. Delivery code: 4821.`,
      `[sms:dev] to 9123456780 (rider_arrived): Your Riderzpro rider has arrived with order ${number}. Share code 4821 only after you get the parcel.`,
      "[sms:dev] to 9811111111 (rider_offer): New Riderzpro delivery near Gurugram. Open the rider app to accept.",
    ]);
  });

  process.stdout.write("5. Sign-in codes (otp.ts)\n");
  await check("console code, then send + verify; wrong code refused; code single-use", async () => {
    logs.length = 0;
    await otp.sendOtp({ vendorId: null, channel: "mobile", target: "9123456780", purpose: "customer_login" });
    const line = logs.find((l) => l.startsWith("[otp:dev] customer_login code for mobile 9123456780: "));
    assert.ok(line, "console code printed in the same format");
    const code = line.slice(-6);
    await assert.rejects(otp.checkOtp({ target: "9123456780", purpose: "customer_login", code: code === "000000" ? "111111" : "000000" }), /not right/);
    await otp.checkOtp({ target: "9123456780", purpose: "customer_login", code });
    await assert.rejects(otp.checkOtp({ target: "9123456780", purpose: "customer_login", code }), /expired/);
    await assert.rejects(otp.sendOtp({ vendorId: null, channel: "mobile", target: "9123456780", purpose: "customer_login" }), /wait 30 seconds/);
  });

  await check("provider requests unchanged: Resend (RESEND_FROM alias), MSG91 OTP API, Twilio", async () => {
    process.env.OTP_SEND_IN_DEV = "true";
    try {
      process.env.RESEND_API_KEY = "re_fake";
      process.env.RESEND_FROM = "Riderzpro <codes@example.test>";
      sent.length = 0;
      await otp.sendOtp({ vendorId: null, channel: "email", target: "a@example.test", purpose: "customer_login" });
      assert.equal(sent[0].url, "https://api.resend.com/emails");
      const body = JSON.parse(sent[0].init.body);
      assert.deepEqual(Object.keys(body), ["from", "to", "subject", "text"]);
      assert.equal(body.from, "Riderzpro <codes@example.test>");
      assert.match(body.subject, /^Your Riderzpro code: \d{6}$/);
      assert.match(body.text, /^\d{6} is your Riderzpro sign-in code\. It expires in 10 minutes\. Do not share it with anyone\.$/);
      assert.equal(sent[0].init.headers.Authorization, "Bearer re_fake");

      process.env.MSG91_AUTH_KEY = "m_fake";
      process.env.MSG91_OTP_TEMPLATE_ID = "otp_tmpl";
      sent.length = 0;
      await otp.sendOtp({ vendorId: null, channel: "mobile", target: "9811111111", purpose: "rider_login" });
      const u = new URL(sent[0].url);
      assert.equal(u.origin + u.pathname, "https://control.msg91.com/api/v5/otp");
      assert.deepEqual([u.searchParams.get("template_id"), u.searchParams.get("mobile"), u.searchParams.get("otp_expiry")], ["otp_tmpl", "919811111111", "10"]);
      assert.match(u.searchParams.get("otp"), /^\d{6}$/);
      assert.equal(sent[0].init.headers.authkey, "m_fake");

      // MSG91 key without the OTP template: codes fall back to Twilio, as before.
      delete process.env.MSG91_OTP_TEMPLATE_ID;
      process.env.TWILIO_ACCOUNT_SID = "AC_fake";
      process.env.TWILIO_AUTH_TOKEN = "t_fake";
      process.env.TWILIO_FROM = "+10000000000";
      sent.length = 0;
      await otp.sendOtp({ vendorId: null, channel: "mobile", target: "9822222222", purpose: "rider_login" });
      assert.equal(sent[0].url, "https://api.twilio.com/2010-04-01/Accounts/AC_fake/Messages.json");
      const form = new URLSearchParams(String(sent[0].init.body));
      assert.deepEqual([form.get("To"), form.get("From")], ["+919822222222", "+10000000000"]);
      assert.match(form.get("Body"), /^\d{6} is your Riderzpro rider sign-in code\./);

      // A refusal still answers 502 otp_failed and logs only the status.
      fetchAnswer = () => new Response("secret echo", { status: 401 });
      logs.length = 0;
      await assert.rejects(otp.sendOtp({ vendorId: null, channel: "mobile", target: "9833333333", purpose: "rider_login" }), (e) => e.status === 502 && e.code === "otp_failed");
      assert.ok(logs.includes("[otp] mobile provider answered 401"));
      assert.ok(!logs.some((l) => l.includes("secret echo") || l.includes("t_fake")));
    } finally {
      for (const k of ["OTP_SEND_IN_DEV", "RESEND_API_KEY", "RESEND_FROM", "MSG91_AUTH_KEY", "MSG91_OTP_TEMPLATE_ID", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM"]) delete process.env[k];
    }
  });

  process.stdout.write(`\nAll ${passed} checks passed.\n`);
} finally {
  process.chdir(tmpdir());
  rmSync(dir, { recursive: true, force: true });
}
process.exit(0);
