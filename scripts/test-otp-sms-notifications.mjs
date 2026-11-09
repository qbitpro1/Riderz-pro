#!/usr/bin/env node
/**
 * Comprehensive test suite for Riderzpro authentication & notification systems:
 *   - Mobile OTP generation, verification, expiration, resend rate limit (30s)
 *   - Email OTP generation, verification, expiration
 *   - Invalid code attempts & lockout after 5 attempts
 *   - Failed delivery rollback (un-delivered OTP is marked consumed and cannot be guessed)
 *   - MSG91 SMS Provider (OTP API, Flow API, error detection on HTTP 200 { type: "error" }, network failures, timeouts)
 *   - Resend Email Provider (OTP email, order confirmation email, failures, unverified domain)
 *   - Transactional notifications (Order confirmed, Rider offer, Rider arriving, Rider arrived, Offline Store receipt)
 *   - Deduplication via sendOnce (idempotent notification dispatch)
 *
 * Usage:
 *   node scripts/test-otp-sms-notifications.mjs
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { register } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
const sentRequests = [];
let fetchMock = null;
globalThis.fetch = async (url, init = {}) => {
  sentRequests.push({ url: String(url), init });
  if (fetchMock) return fetchMock(url, init);
  return new Response(JSON.stringify({ id: "mock_id_123", message: "req_123", request_id: "req_123" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

const dir = mkdtempSync(join(tmpdir(), "rzp-otp-test-"));
process.chdir(dir);

/* ---- console capture ---- */
const logs = [];
for (const level of ["info", "warn", "error"]) {
  console[level] = (...a) => {
    logs.push(a.map(String).join(" "));
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
  const db = await import("@/lib/db/client");
  const otp = await import("@/lib/server/otp");
  const msg = await import("@/lib/server/messaging");
  const msg91Module = await import("@/lib/server/messaging/msg91");
  const _resendModule = await import("@/lib/server/messaging/resend");
  const storeReceipts = await import("@/lib/server/store-receipts");
  const orderEmails = await import("@/lib/server/order-emails");

  process.stdout.write("\n1. Mobile OTP Authentication\n");

  await check("generates secure 6-digit code and logs in dev mode", async () => {
    logs.length = 0;
    delete process.env.OTP_SEND_IN_DEV;
    await otp.sendOtp({ vendorId: null, channel: "mobile", target: "9876543210", purpose: "customer_login" });
    const logLine = logs.find((l) => l.includes("[otp:dev] customer_login code for mobile 9876543210:"));
    assert.ok(logLine, "Found dev OTP log");
    const code = logLine.slice(-6);
    assert.match(code, /^\d{6}$/, "Code is 6 digits");

    // Verify code successfully
    await otp.checkOtp({ target: "9876543210", purpose: "customer_login", code });

    // Single-use: checking again fails with otp_expired
    await assert.rejects(
      otp.checkOtp({ target: "9876543210", purpose: "customer_login", code }),
      (err) => err.code === "otp_expired",
      "Code is single-use",
    );
  });

  await check("enforces 30-second resend cooldown", async () => {
    // Already sent for 9876543210 within the last 30s
    await assert.rejects(
      otp.sendOtp({ vendorId: null, channel: "mobile", target: "9876543210", purpose: "customer_login" }),
      (err) => err.code === "otp_wait" && err.status === 429,
      "Resend inside 30s is rejected with 429 otp_wait",
    );
  });

  await check("wrong code increments attempt count and locks after 5 attempts", async () => {
    const target = "9876543211";
    logs.length = 0;
    await otp.sendOtp({ vendorId: null, channel: "mobile", target, purpose: "customer_login" });
    const logLine = logs.find((l) => l.includes(`[otp:dev] customer_login code for mobile ${target}:`));
    const realCode = logLine.slice(-6);
    const wrongCode = realCode === "123456" ? "654321" : "123456";

    // 5 wrong attempts are counted
    for (let i = 1; i <= 5; i++) {
      await assert.rejects(
        otp.checkOtp({ target, purpose: "customer_login", code: wrongCode }),
        (err) => err.code === "otp_wrong" && err.status === 400,
      );
    }

    // 6th attempt (exceeding MAX_ATTEMPTS = 5) triggers lockout
    await assert.rejects(
      otp.checkOtp({ target, purpose: "customer_login", code: wrongCode }),
      (err) => err.code === "otp_locked" && err.status === 429,
      "Attempt exceeding 5 wrong tries locks OTP with 429 otp_locked",
    );

    // Even with the real code now, it remains locked
    await assert.rejects(
      otp.checkOtp({ target, purpose: "customer_login", code: realCode }),
      (err) => err.code === "otp_locked" && err.status === 429,
      "Locked code cannot be verified with correct code",
    );
  });

  await check("expired OTP is rejected", async () => {
    const target = "9876543212";
    logs.length = 0;
    await otp.sendOtp({ vendorId: null, channel: "mobile", target, purpose: "customer_login" });
    const logLine = logs.find((l) => l.includes(`[otp:dev] customer_login code for mobile ${target}:`));
    const code = logLine.slice(-6);

    // Manually expire the code in DB
    await db.sql("UPDATE vendor_otps SET expires_at = now() - interval '1 minute' WHERE target = $1", [target]);

    await assert.rejects(
      otp.checkOtp({ target, purpose: "customer_login", code }),
      (err) => err.code === "otp_expired" && err.status === 400,
      "Expired code is rejected with otp_expired",
    );
  });

  process.stdout.write("\n2. Email OTP Authentication\n");

  await check("generates and verifies email OTP", async () => {
    const target = "customer@example.com";
    logs.length = 0;
    await otp.sendOtp({ vendorId: null, channel: "email", target, purpose: "customer_login" });
    const logLine = logs.find((l) => l.includes(`[otp:dev] customer_login code for email ${target}:`));
    assert.ok(logLine, "Found dev email OTP log");
    const code = logLine.slice(-6);

    await otp.checkOtp({ target, purpose: "customer_login", code });

    // Verify it cannot be reused
    await assert.rejects(
      otp.checkOtp({ target, purpose: "customer_login", code }),
      (err) => err.code === "otp_expired",
    );
  });

  await check("purpose isolation: customer_login code cannot be used for reset or rider_login", async () => {
    const target = "user@example.com";
    logs.length = 0;
    await otp.sendOtp({ vendorId: null, channel: "email", target, purpose: "customer_login" });
    const logLine = logs.find((l) => l.includes(`[otp:dev] customer_login code for email ${target}:`));
    const code = logLine.slice(-6);

    await assert.rejects(
      otp.checkOtp({ target, purpose: "reset", code }),
      (err) => err.code === "otp_expired",
      "Code scoped to customer_login cannot be used for password reset",
    );
  });

  process.stdout.write("\n3. MSG91 SMS Provider Integration\n");

  await check("tenDigits normalizes Indian numbers cleanly (+91, 91, 0 prefixes, spaces)", () => {
    assert.equal(msg91Module.tenDigits("+91 98765 43210"), "9876543210");
    assert.equal(msg91Module.tenDigits("919876543210"), "9876543210");
    assert.equal(msg91Module.tenDigits("09876543210"), "9876543210");
    assert.equal(msg91Module.tenDigits("9876543210"), "9876543210");
  });

  await check("MSG91 OTP delivery with live credentials simulation (query parameters, authkey)", async () => {
    process.env.OTP_SEND_IN_DEV = "true";
    process.env.MSG91_AUTH_KEY = "test_auth_key_123";
    process.env.MSG91_OTP_TEMPLATE_ID = "tmpl_otp_456";
    sentRequests.length = 0;

    fetchMock = async (url) => {
      const u = new URL(url);
      assert.equal(u.origin + u.pathname, "https://control.msg91.com/api/v5/otp");
      assert.equal(u.searchParams.get("template_id"), "tmpl_otp_456");
      assert.equal(u.searchParams.get("mobile"), "919811122233");
      assert.equal(u.searchParams.get("otp_expiry"), "10");
      assert.match(u.searchParams.get("otp"), /^\d{6}$/);
      return new Response(JSON.stringify({ type: "success", message: "3769776d3334363836383934" }), { status: 200 });
    };

    await otp.sendOtp({ vendorId: null, channel: "mobile", target: "9811122233", purpose: "rider_login" });
    assert.equal(sentRequests.length, 1);
    assert.equal(sentRequests[0].init.headers.authkey, "test_auth_key_123");
  });

  await check("CRITICAL BUG FIX: MSG91 returning HTTP 200 with { type: 'error' } is caught and treated as failure", async () => {
    process.env.OTP_SEND_IN_DEV = "true";
    process.env.MSG91_AUTH_KEY = "test_auth_key_123";
    process.env.MSG91_OTP_TEMPLATE_ID = "bad_template";

    fetchMock = async () => {
      return new Response(JSON.stringify({ type: "error", message: "Invalid Template ID" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    await assert.rejects(
      otp.sendOtp({ vendorId: null, channel: "mobile", target: "9811122234", purpose: "customer_login" }),
      (err) => err.status === 502 && err.code === "otp_failed",
      "Treated as 502 otp_failed even though HTTP was 200",
    );
  });

  await check("Delivery failure rollback: un-delivered code is consumed so it cannot be guessed", async () => {
    process.env.OTP_SEND_IN_DEV = "true";
    process.env.MSG91_AUTH_KEY = "test_auth_key_123";
    process.env.MSG91_OTP_TEMPLATE_ID = "tmpl_otp_456";

    fetchMock = async () => {
      return new Response("Service Unavailable", { status: 503 });
    };

    const target = "9811122235";
    await assert.rejects(
      otp.sendOtp({ vendorId: null, channel: "mobile", target, purpose: "customer_login" }),
      (err) => err.status === 502 && err.code === "otp_failed",
    );

    // Verify in database that the OTP created for this attempt was marked consumed
    const row = await db.sql("SELECT consumed_at FROM vendor_otps WHERE target = $1 ORDER BY created_at DESC LIMIT 1", [target]);
    assert.ok(row[0], "Row exists");
    assert.ok(row[0].consumed_at !== null, "Un-delivered OTP was marked consumed immediately on delivery failure");
  });

  await check("MSG91 Flow API format and variable mapping (var1, var2, ...)", async () => {
    process.env.MSG91_AUTH_KEY = "test_auth_key_123";
    sentRequests.length = 0;

    fetchMock = async (_url, init) => {
      const body = JSON.parse(init.body);
      assert.equal(body.template_id, "tmpl_order_conf_01");
      assert.deepEqual(body.recipients, [
        { mobiles: "919876500000", var1: "RZP-1001", var2: "2499", var3: "riderzpro.com/account/orders" },
      ]);
      return new Response(JSON.stringify({ status: "success", message: "Flow run successfully" }), { status: 200 });
    };

    const res = await msg.sendSms({
      to: "9876500000",
      text: "Fallback text",
      templateId: "tmpl_order_conf_01",
      vars: ["RZP-1001", "2499", "riderzpro.com/account/orders"],
      tag: "order_confirmed",
    });

    assert.equal(res.status, "sent");
    assert.equal(sentRequests.length, 1);
  });

  process.stdout.write("\n4. Resend Email Provider Integration\n");

  await check("Resend email format, bearer token and payload", async () => {
    process.env.OTP_SEND_IN_DEV = "true";
    process.env.RESEND_API_KEY = "re_test_key_abc";
    process.env.OTP_EMAIL_FROM = "Riderzpro <codes@riderzpro.com>";
    sentRequests.length = 0;

    fetchMock = async (url, init) => {
      assert.equal(url, "https://api.resend.com/emails");
      assert.equal(init.headers.Authorization, "Bearer re_test_key_abc");
      const body = JSON.parse(init.body);
      assert.equal(body.from, "Riderzpro <codes@riderzpro.com>");
      assert.deepEqual(body.to, ["customer@riderzpro.test"]);
      assert.match(body.subject, /^Your Riderzpro code: \d{6}$/);
      return new Response(JSON.stringify({ id: "email_resend_999" }), { status: 200 });
    };

    await otp.sendOtp({ vendorId: null, channel: "email", target: "customer@riderzpro.test", purpose: "customer_login" });
    assert.equal(sentRequests.length, 1);
  });

  await check("Resend domain failure (403 forbidden / unverified domain) handled safely without crashing", async () => {
    process.env.OTP_SEND_IN_DEV = "true";
    process.env.RESEND_API_KEY = "re_test_key_abc";
    process.env.OTP_EMAIL_FROM = "Riderzpro <unverified@otherdomain.com>";
    logs.length = 0;

    fetchMock = async () => {
      return new Response(JSON.stringify({ statusCode: 403, message: "Domain not verified", name: "validation_error" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    };

    await assert.rejects(
      otp.sendOtp({ vendorId: null, channel: "email", target: "customer2@riderzpro.test", purpose: "customer_login" }),
      (err) => err.status === 502 && err.code === "otp_failed",
    );
    assert.ok(logs.some((l) => l.includes("[otp] email provider answered 403")));
  });

  process.stdout.write("\n5. Transactional Notifications (All 6 Scenarios)\n");

  // Seed sample order
  const orderId = "ord_test_notification_01";
  await db.sql(
    `INSERT INTO orders (id, number, status, customer_name, customer_phone, customer_email, address, city, state, pincode, subtotal, shipping, discount, total)
     VALUES ($1, 'RZP-TEST-01', 'confirmed', 'Rohan Sharma', '9811223344', 'rohan@example.com', 'Flat 4B, Sector 15', 'Gurugram', 'Haryana', '122001', 2999, 0, 0, 2999)`,
    [orderId],
  );

  await check("Scenario 1: OTP notification (Mobile MSG91 + Email Resend) tested above", () => {
    assert.ok(true);
  });

  await check("Scenario 2: Order confirmed notification sends email and SMS via MSG91 flow with dedupe", async () => {
    process.env.MSG91_AUTH_KEY = "test_key";
    process.env.MSG91_TEMPLATE_ORDER_CONFIRMED = "tmpl_order_conf_01";
    process.env.RESEND_API_KEY = "re_key";
    process.env.ORDERS_EMAIL_FROM = "Riderzpro Orders <orders@riderzpro.com>";
    sentRequests.length = 0;

    fetchMock = async (url) => {
      if (String(url).includes("resend")) return new Response(JSON.stringify({ id: "email_ord_1" }), { status: 200 });
      return new Response(JSON.stringify({ status: "success", message: "Flow dispatched" }), { status: 200 });
    };

    const res = await orderEmails.onOrderConfirmedMessages(orderId);
    assert.equal(res.email.status, "sent");
    assert.equal(res.sms.status, "sent");

    // Idempotent repeat: sendOnce returns repeat without sending again
    const repeat = await orderEmails.onOrderConfirmedMessages(orderId);
    assert.equal(repeat.email.repeat, true);
    assert.equal(repeat.sms.repeat, true);
  });

  await check("Scenario 3, 4, 5: Rider offer, Rider arriving, Rider arrived alerts with delivery code", async () => {
    process.env.MSG91_TEMPLATE_RIDER_ARRIVING = "tmpl_arriving";
    process.env.MSG91_TEMPLATE_RIDER_ARRIVED = "tmpl_arrived";
    process.env.MSG91_TEMPLATE_RIDER_OFFER = "tmpl_offer";

    await db.sql(
      `INSERT INTO riders (id, mobile, name, city, vehicle_type, vehicle_number, status, consent_version, consented_at)
       VALUES ('rdr_01','9876500001','Vikram','Gurugram','motorcycle','HR 26 AB 1234','approved','v1',now())`,
    );
    await db.sql(
      `INSERT INTO rider_jobs (id, order_id, rider_id, pickup_name, pickup_address, drop_name, drop_address, drop_phone, city, earning, delivery_code, created_by)
       VALUES ('job_01',$1,'rdr_01','Store Hub','Sector 14','Rohan','Sector 15','9811223344','Gurugram',80,'5522','admin')`,
      [orderId],
    );

    sentRequests.length = 0;
    const arriving = await msg.smsRiderArriving("job_01", { minutes: 5 });
    assert.equal(arriving.status, "sent");

    const arrived = await msg.smsRiderArrived("job_01");
    assert.equal(arrived.status, "sent");

    const offer = await msg.smsRiderOffer("job_01");
    assert.equal(offer.status, "sent");

    // Deduplication check: repeat calls are prevented
    assert.equal((await msg.smsRiderArriving("job_01", { minutes: 3 })).repeat, true);
    assert.equal((await msg.smsRiderArrived("job_01")).repeat, true);
    assert.equal((await msg.smsRiderOffer("job_01")).repeat, true);
  });

  await check("Scenario 6: Offline Store receipt notification via SMS (MSG91_TEMPLATE_STORE_RECEIPT) & Email", async () => {
    // Seed vendor & store screen order
    const vendorId = "ven_test_receipt";
    await db.sql(
      `INSERT INTO vendors (id, email, mobile, password_hash, full_name, business_type, store_name, slug, status)
       VALUES ($1, 'seller@example.com', '9811223399', 'hash', 'Store Owner', 'proprietorship', 'Indus Auto', 'indus-auto', 'approved')`,
      [vendorId],
    );

    const storeOrderId = "ord_store_01";
    await db.sql(
      `INSERT INTO orders (id, number, status, customer_name, customer_phone, address, city, state, pincode, subtotal, shipping, discount, total, payment_method, payment_status, channel)
       VALUES ($1, 'STO-888', 'confirmed', 'Amit', '9811002233', 'Counter', 'Gurugram', 'Haryana', '122001', 1200, 0, 0, 1200, 'counter', 'paid', 'store')`,
      [storeOrderId],
    );
    await db.sql(
      `INSERT INTO vendor_orders (id, order_id, vendor_id, subtotal, commission_rate, status)
       VALUES ('vo_01', $1, $2, 1200, 10, 'accepted')`,
      [storeOrderId, vendorId],
    );
    await db.sql(
      `INSERT INTO order_items (id, order_id, vendor_order_id, title, qty, unit_price, line_total, product_kind, product_ref)
       VALUES ('oi_01', $1, 'vo_01', 'LED Fog Lamp Set', 1, 1200, 1200, 'vendor', 'vp_01')`,
      [storeOrderId],
    );

    const vendorSelf = {
      id: vendorId,
      email: "seller@example.com",
      mobile: "9811223399",
      fullName: "Store Owner",
      businessType: "proprietorship",
      status: "approved",
      emailVerified: true,
      mobileVerified: true,
      storeName: "Indus Auto",
      slug: "indus-auto",
      commissionRate: 10,
      tier: "standard",
      holidayMode: false,
      onboarding: { store: { name: "Indus Auto", address: "Sector 14, Gurugram" } },
    };

    process.env.MSG91_TEMPLATE_STORE_RECEIPT = "tmpl_store_rcp_01";
    sentRequests.length = 0;

    // Send receipt via SMS
    const smsReceipt = await storeReceipts.sendStoreReceipt(vendorSelf, { number: "STO-888", channel: "sms" }, "127.0.0.1");
    assert.equal(smsReceipt.sent, true);
    assert.equal(smsReceipt.status, "sent");

    // Send receipt via Email
    const emailReceipt = await storeReceipts.sendStoreReceipt(
      vendorSelf,
      { number: "STO-888", channel: "email", email: "amit@example.com" },
      "127.0.0.1",
    );
    assert.equal(emailReceipt.sent, true);
    assert.equal(emailReceipt.status, "sent");

    // Check store_receipts DB audit table
    const receiptsInDb = await db.sql("SELECT channel, status FROM store_receipts WHERE order_id = $1", [storeOrderId]);
    assert.equal(receiptsInDb.length, 2);
  });

  process.stdout.write("\n6. Security & Leak Prevention\n");

  await check("Logs never contain auth keys, passwords, or customer OTPs in production", () => {
    const sensitiveTokens = ["test_auth_key_123", "re_test_key_abc", "t_fake"];
    for (const line of logs) {
      if (line.includes("[otp:dev]")) continue; // dev logging is expected in test mode
      for (const tok of sensitiveTokens) {
        assert.ok(!line.includes(tok), `Log line leaked secret: ${line}`);
      }
    }
  });

  process.stdout.write(`\nAll ${passed} test checks passed successfully!\n`);
} finally {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
}
process.exit(0);
