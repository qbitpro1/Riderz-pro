# Team to-do files (written 17 Oct 2026; the team fills these in on Monday 19 Oct 2026)

Phase 3 (live tracking) and Phase 4 (payments and invoices) are being built now with test settings and
placeholders. These files list what only the team can provide. Each one says what is needed, the
setting name, and why.

| File | Person | Area | Blocks |
| --- | --- | --- | --- |
| [Sathwil_work.md](Sathwil_work.md) | Sathwil | Razorpay, refunds, GST invoice | Real test payments (Phase 4), go-live |
| [Vamsi_work.md](Vamsi_work.md) | Vamsi | New PostgreSQL database, encryption key, data rules | Staging, go-live |
| [Amrutha_work.md](Amrutha_work.md) | Amrutha | OTP, SMS (MSG91/Twilio, DLT), email (Resend) | Real SMS codes, rider alerts, order emails |
| [Hosting_work.md](Hosting_work.md) | To be assigned | Hosting, env settings, domain switch | Real-phone tracking test, go-live |
| [Maps_work.md](Maps_work.md) | To be assigned | Map tiles, routing, geocoding keys | Production use of tracking maps |

Start first, because these take days: Amrutha's DLT template approvals, and Sathwil's Razorpay KYC.

Rule for everyone: secret values go only into the hosting dashboard or a password manager, never into
chat, email or git.
