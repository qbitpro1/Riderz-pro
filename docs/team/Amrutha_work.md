# Amrutha: sign-in codes, SMS and email

Updated 18 Oct 2026. Codes, order emails, order SMS and the rider "arriving / arrived" alerts are
built; they print to the console until the providers below are set. Secrets go only into the hosting
dashboard or a password manager.

## Before launch (must do)

1. **Urgent: rotate the Resend API key and the Twilio auth token.** Both were pasted into a chat on
   17 Oct 2026. Create new ones and delete the old.
2. **SMS provider.** Twilio is a trial with no number, so no SMS can be sent today.
   - **MSG91 (recommended for India):**
     - DLT registration and an approved sender ID (e.g. `RDRZPR`)
     - an OTP template with `##OTP##`, e.g.
       `##OTP## is your Riderzpro code. It expires in 10 minutes. Do not share it. - Riderzpro`
     - send `MSG91_AUTH_KEY` and `MSG91_OTP_TEMPLATE_ID`.
   - **Or Twilio:** a paid number able to reach India (DLT applies) as `TWILIO_FROM`, plus the new
     `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`.
   - If both are set, `OTP_SMS_PROVIDER=msg91` or `twilio`.
3. **DLT templates for order and delivery SMS** (approval takes days: start now). The variables go in
   this order; in MSG91 Flow name them `var1`, `var2`, …

   | Setting for the template id | Text |
   | --- | --- |
   | `MSG91_TEMPLATE_ORDER_CONFIRMED` | `Thanks! Riderzpro order {#var#} for Rs {#var#} is confirmed. Track: {#var#}` |
   | `MSG91_TEMPLATE_RIDER_ARRIVING` | `Your Riderzpro order {#var#} is arriving in about {#var#} minutes. Delivery code: {#var#}.` |
   | `MSG91_TEMPLATE_RIDER_ARRIVED` | `Your Riderzpro rider has arrived with order {#var#}. Share code {#var#} only after you get the parcel.` |
   | `MSG91_TEMPLATE_RIDER_OFFER` | `New Riderzpro delivery near {#var#}. Open the rider app to accept.` |
4. **Email (Resend).**
   - Verify riderzpro.com in Resend (Domains → Add) and give Hema the SPF / DKIM / return-path
     records to add.
   - Senders:
     - `OTP_EMAIL_FROM` (e.g. `Riderzpro <codes@riderzpro.com>`)
     - `ORDERS_EMAIL_FROM` (e.g. `Riderzpro Orders <orders@riderzpro.com>`)
   - Set `RESEND_API_KEY` (the new one).
5. **Test recipients:** one email address and one Indian mobile the developer may send real test
   messages to.

## Decisions

- Support contact printed in emails and invoices [`hello@riderzpro.com`, `+91 98860 44488`]: confirm.

## When done

Tell the developer. They send one real code by email and by SMS to your test recipients and check
the order and rider messages on staging.
