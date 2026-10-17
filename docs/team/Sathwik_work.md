# Sathwik: billing, payments and invoices (Phase 4)

Written 17 Oct 2026. Development carries on without these, using Razorpay **test mode** and
placeholders. Nothing here blocks building; these items block **testing real payments** and **go-live**.

**How to send secrets:** never in chat, email, WhatsApp or git. Put them straight into the hosting
dashboard's environment settings, and give the developer test keys only, through a password manager
or by typing them into `.env.local` on the dev machine.

## 1. Razorpay keys (needed first)

| What | Env name | Where to find it |
| --- | --- | --- |
| Test Key ID (`rzp_test_…`) | `RAZORPAY_KEY_ID` | Razorpay Dashboard → Test mode → Account & Settings → API keys |
| Test Key Secret | `RAZORPAY_KEY_SECRET` | Shown once when the key is generated |
| Webhook secret (any long random text you choose) | `RAZORPAY_WEBHOOK_SECRET` | You set it when adding the webhook below |
| Live Key ID and Secret | same names, in hosting only | Only after KYC is approved, only at go-live |

## 2. Webhook (set up once the site has its final address)

- URL: `https://riderzpro.com/api/payments/razorpay/webhook` (built and tested, 17 Oct 2026).
- Events: `payment.captured`, `payment.failed`, `order.paid`, `refund.created`, `refund.processed`, `refund.failed`.
- Use the same secret as `RAZORPAY_WEBHOOK_SECRET`.

## 3. Account settings to confirm

- [ ] KYC / account activation status (live payments need it).
- [ ] Payment capture is **automatic** (Settings → Payment capture).
- [ ] Payment methods to switch on: UPI, cards, netbanking, wallets, EMI? (say which).
- [ ] Settlement bank account is Motorbotz Automotive Pvt. Ltd.'s current account.
- [ ] Seller payments: does Riderzpro collect the full amount and pay sellers later (current plan),
      or should Razorpay **Route** split payments to sellers automatically? Route needs a separate
      Razorpay approval.
- [ ] Cash on delivery: keep it alongside online payment, or online only?

## 4. Refund rules (business decision)

- [ ] Who can approve a refund (admin only?), and the limit before a second approval is needed.
- [ ] Full and partial refunds allowed? Is the delivery charge refunded?
- [ ] Refund timing to state on the site (Razorpay usually takes 5–7 working days).

## 5. Customer GST tax invoice

The site already holds these values (`src/lib/data/site.ts`). Please **confirm each one or correct it**:

- [ ] Legal name: Motorbotz Automotive Pvt. Ltd.
- [ ] GSTIN: 29AAJCM4412Q1ZP (Karnataka)
- [ ] Registered address printed on the invoice (exact text, with PIN code)
- [ ] Invoice number format, e.g. `RZP/2026-27/00001`, starting again each financial year?
- [ ] HSN code and GST rate for each category of Riderzpro's own products (the code assumes 18%
      when none is given). A spreadsheet of category → HSN → rate is enough.
- [ ] GST on the delivery charge (rate and HSN/SAC code).
- [ ] Authorised signatory name and designation, and whether a signature or stamp image is needed.
- [ ] Footer terms text (returns, warranty, "computer-generated invoice", etc.).
- [ ] **Accountant check:** as a marketplace, does Riderzpro have to collect TCS (GST section 52) on
      seller sales, and file GSTR-8? This decides whether the platform keeps a TCS ledger.
      (Sellers already issue their own invoices from the seller portal for their items.)

## 6. Order confirmation email

Sent through Resend. It needs the sending domain verified (see `Amrutha_work.md`). Please confirm:

- [ ] Sender name and address, e.g. `Riderzpro Orders <orders@riderzpro.com>`.
- [ ] Support email and phone to print in the email.

## 7. Placeholders now in the code (built 17 Oct 2026, please confirm or correct)

Online payment, refunds and the customer tax invoice are built. These values are placeholders until
you confirm them (`src/lib/invoice/gst.ts`, `src/lib/data/site.ts`):

- [ ] Registered office address on the invoice: the Bengaluru address is used for now.
- [ ] HSN and GST rate per product department: every item uses HSN 8708 at 18% for now.
- [ ] Installation: SAC 998714 at 18%. Delivery charge: SAC 996812 at 18%. Or should delivery take
      the goods' rate?
- [ ] Unpaid online orders hold stock for **30 minutes**, then are cancelled. Right length?
- [ ] Refunds: today any admin can refund up to the amount paid, in whole rupees; the delivery charge
      isn't included in the suggested amount. Who should approve, and is there a limit?
- [ ] A payment that arrives after its order was released is kept and flagged for a refund; there is
      no automatic refund. OK?
- [ ] Cancelling a paid order does not refund by itself (the admin page then offers the refund). OK?
- [ ] Credit notes for refunds after an invoice is issued are not built yet. Needed now?
- [ ] Buyers are treated as consumers (no field for a buyer's GSTIN). Needed for business buyers?
- [ ] The wording on the Payments help page (`/support/payments`): "Pay online with Razorpay, or
      confirm on WhatsApp; unpaid online orders are cancelled after 30 minutes."

## When done

Tell the owner which boxes are ticked. The developer then switches the payment tests from placeholders
to the real test keys and runs a full test order, a failed payment and a refund in Razorpay test mode.
