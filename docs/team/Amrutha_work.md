# Amrutha: sign-in codes (OTP), SMS and email (Twilio, MSG91, Resend)

Written 17 Oct 2026. Codes are printed in the dev-server console during development, so building
carries on. These items block **real SMS codes** for riders and customers, the **rider arriving / arrived**
alerts in Phase 3, the **order confirmation email** in Phase 4, and go-live.

**How to send secrets:** never in chat, email, WhatsApp or git. Put production values straight into
the hosting dashboard; give the developer test values through a password manager.

## 0. Urgent: rotate keys

The Resend API key and the Twilio auth token were pasted into a chat on 17 Oct 2026. Please create new
ones, delete the old ones, and put the new ones into the hosting dashboard (and the dev machine's
`.env.local`).

## 1. SMS (most important)

The Twilio account is a **trial with no phone number** (`TWILIO_FROM` is empty), so no SMS can be sent.
Choose one:

**Option A: MSG91 (recommended for India: cheaper, DLT-ready)**

- [ ] DLT registration (entity ID) on a telecom DLT portal, and an approved **sender ID** (header), e.g. `RDRZPR`.
- [ ] Approved OTP template, with `##OTP##` where the code goes. Suggested text:
      `##OTP## is your Riderzpro code. It expires in 10 minutes. Do not share it. - Riderzpro`
- [ ] Send `MSG91_AUTH_KEY` and `MSG91_OTP_TEMPLATE_ID`.

**Option B: Twilio**

- [ ] Upgrade from the trial and buy a number that can send SMS to India, or use an alphanumeric
      sender with DLT registration (Indian carriers block unregistered SMS).
- [ ] Send `TWILIO_FROM` (and the new `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`).

If keys for both are set, also set `OTP_SMS_PROVIDER` to `msg91` or `twilio`.

## 2. Extra SMS templates for Phase 3 and 4 (DLT approval takes days, so start early)

- [ ] Rider arriving: `Your Riderzpro order {#var#} is arriving in about {#var#} minutes. Delivery code: {#var#}.`
- [ ] Rider arrived: `Your Riderzpro rider has arrived with order {#var#}. Share code {#var#} only after you get the parcel.`
- [ ] Order confirmed: `Thanks! Riderzpro order {#var#} for Rs {#var#} is confirmed. Track: {#var#}`
- [ ] Rider job offer: `New Riderzpro delivery near {#var#}. Open the rider app to accept.`

Wording can change; send back the approved template IDs.

## 3. Email (Resend)

- [ ] Verify the sending domain in Resend (Domains → Add): add the SPF, DKIM and return-path DNS records
      it shows at the domain's DNS provider. The current sender `entangle@silicofeller-quantum.com` must
      be verified, or better, switch to a riderzpro.com address.
- [ ] Choose the senders: codes, e.g. `Riderzpro <codes@riderzpro.com>` (`OTP_EMAIL_FROM`), and order
      emails, e.g. `orders@riderzpro.com`.
- [ ] Give the owner one email address that may receive a **real test code** (the developer will not
      send real emails or SMS to anyone without a named recipient).
- [ ] Give one Indian mobile number for the real SMS test, once SMS works.

## 4. Settings now in the code (built 17 Oct 2026)

| Setting | What |
| --- | --- |
| `MSG91_TEMPLATE_ORDER_CONFIRMED` | Template id for "order confirmed" (variables: order number, amount, link) |
| `MSG91_TEMPLATE_RIDER_ARRIVING` | "Rider arriving" (order number, minutes, delivery code) |
| `MSG91_TEMPLATE_RIDER_ARRIVED` | "Rider arrived" (order number, delivery code) |
| `MSG91_TEMPLATE_RIDER_OFFER` | "New delivery near …" to the rider (area) |
| `ORDERS_EMAIL_FROM` | Sender for order emails, e.g. `Riderzpro Orders <orders@riderzpro.com>` |

- In MSG91 Flow, name the variables `var1`, `var2`, … in the order listed above.
- Without a template id, that SMS is skipped and noted in the console (Twilio needs none).
- [ ] Confirm the support contact printed in emails and invoices: `hello@riderzpro.com` and
      `+91 98860 44488` are used now.

## When done

Tell the owner which parts are ready. The developer then sends one real code by email and one by SMS
to the named test recipients, and checks the rider alerts in Phase 3.
