#!/usr/bin/env node
/**
 * Unit test for the Razorpay signature checks in src/lib/payments/signature.ts, with a fake secret.
 * Needs Node 22.18+ / 23.6+ (runs the .ts module with built-in type stripping).
 *
 *   node scripts/test-payments-signature.mjs
 */
import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import {
  hmacSha256Hex,
  rupeesToPaise,
  sameHexDigest,
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from "../src/lib/payments/signature.ts";

const SECRET = "fake_key_secret_for_tests_only";
const WH_SECRET = "fake_webhook_secret_for_tests_only";
let passed = 0;
const t = (name, fn) => {
  fn();
  passed++;
  console.log(`ok  ${name}`);
};

const ref = (secret, data) => createHmac("sha256", secret).update(data).digest("hex");

t("hmac matches node:crypto reference", () => {
  assert.equal(hmacSha256Hex(SECRET, "order_A|pay_B"), ref(SECRET, "order_A|pay_B"));
});

// Razorpay's documented construction: order_id + "|" + payment_id
const orderId = "order_IluGWxBm9U8zJ8";
const paymentId = "pay_IluGfwOXDAp6Lp";
const good = ref(SECRET, `${orderId}|${paymentId}`);

t("checkout: valid signature accepted", () => assert.equal(verifyCheckoutSignature(orderId, paymentId, good, SECRET), true));
t("checkout: upper-case hex accepted", () => assert.equal(verifyCheckoutSignature(orderId, paymentId, good.toUpperCase(), SECRET), true));
t("checkout: wrong secret rejected", () => assert.equal(verifyCheckoutSignature(orderId, paymentId, ref("other", `${orderId}|${paymentId}`), SECRET), false));
t("checkout: swapped ids rejected", () => assert.equal(verifyCheckoutSignature(paymentId, orderId, good, SECRET), false));
t("checkout: other payment id rejected", () => assert.equal(verifyCheckoutSignature(orderId, "pay_SOMETHINGELSE1", good, SECRET), false));
t("checkout: one flipped character rejected", () => {
  const bad = (good[0] === "a" ? "b" : "a") + good.slice(1);
  assert.equal(verifyCheckoutSignature(orderId, paymentId, bad, SECRET), false);
});
t("checkout: truncated / non-hex / empty rejected", () => {
  assert.equal(verifyCheckoutSignature(orderId, paymentId, good.slice(0, 63), SECRET), false);
  assert.equal(verifyCheckoutSignature(orderId, paymentId, "z".repeat(64), SECRET), false);
  assert.equal(verifyCheckoutSignature(orderId, paymentId, "", SECRET), false);
});
t("checkout: empty secret never verifies", () => assert.equal(verifyCheckoutSignature(orderId, paymentId, ref("", `${orderId}|${paymentId}`), ""), false));

const body = JSON.stringify({ entity: "event", event: "payment.captured", payload: { payment: { entity: { id: paymentId, amount: 50000 } } } });
const whGood = ref(WH_SECRET, body);
t("webhook: valid signature on raw body accepted", () => assert.equal(verifyWebhookSignature(body, whGood, WH_SECRET), true));
t("webhook: header whitespace tolerated", () => assert.equal(verifyWebhookSignature(body, ` ${whGood} `, WH_SECRET), true));
t("webhook: re-serialised body rejected", () => {
  const reserialised = JSON.stringify(JSON.parse(body), null, 2);
  assert.equal(verifyWebhookSignature(reserialised, whGood, WH_SECRET), false);
});
t("webhook: tampered amount rejected", () => assert.equal(verifyWebhookSignature(body.replace("50000", "1"), whGood, WH_SECRET), false));
t("webhook: missing header rejected", () => assert.equal(verifyWebhookSignature(body, null, WH_SECRET), false));
t("webhook: key secret is not the webhook secret", () => assert.equal(verifyWebhookSignature(body, ref(SECRET, body), WH_SECRET), false));
t("webhook: bytes input works", () => assert.equal(verifyWebhookSignature(Buffer.from(body), whGood, WH_SECRET), true));

t("sameHexDigest: equal / unequal", () => {
  assert.equal(sameHexDigest(good, good), true);
  assert.equal(sameHexDigest(good, whGood), false);
});

t("rupeesToPaise: integer rupees only", () => {
  assert.equal(rupeesToPaise(1499), 149900);
  assert.equal(rupeesToPaise(0), 0);
  assert.throws(() => rupeesToPaise(10.5));
  assert.throws(() => rupeesToPaise(-1));
});

console.log(`\n${passed} signature checks passed`);
