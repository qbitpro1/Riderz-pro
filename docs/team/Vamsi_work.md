# Vamsi: database and data security

Written 17 Oct 2026. Development carries on with the embedded database on the dev machine
(`.data/pglite`), so nothing here blocks building. These items block **go-live** and
**testing on a real server**.

**How to send secrets:** never in chat, email, WhatsApp or git. Put production values straight into
the hosting dashboard; give the developer only the dev/staging URL, through a password manager.

## 1. A new, empty PostgreSQL database (main item)

- [ ] **New and empty.** Do **not** reuse the old riderzpro.com database. Its tables (`orders`,
      `order_items`, `customers`, `customer_addresses`, `support_tickets`) have the same names as ours
      but different columns, so the two would clash. The old site has no real customers, so nothing
      needs copying.
- [ ] PostgreSQL **16** (14 or newer works). No extensions needed (no PostGIS, no uuid extension).
- [ ] Region: Mumbai (`ap-south-1`) or the nearest region to the hosting.
- [ ] Two databases: **staging** (for testing) and **production**.
- [ ] The database user must be able to create tables. The app creates and updates its own tables
      automatically when it starts (`schema_migrations` table), so no SQL needs to be run by hand.
- [ ] Hosting is serverless, so give the **pooled** connection string (Neon pooler, Supabase pooler or
      PgBouncer) and say the pool size limit.
- [ ] Daily backups with point-in-time restore switched on.

Send as:

| What | Env name | Example shape |
| --- | --- | --- |
| Connection string | `DATABASE_URL` | `postgres://user:pass@host:5432/riderzpro?sslmode=require` |
| Max connections per server instance (optional, default 10) | `DATABASE_POOL_MAX` | `5` |

SSL is switched on automatically for Neon and Supabase hosts, or when the URL has `sslmode=require`.

## 2. Encryption key for sellers' bank details

- [ ] Create once: `openssl rand -base64 32`, then set it as `VENDOR_DATA_KEY` in hosting (production).
- [ ] Store a copy in the company password manager. **If it is lost, stored bank account and PAN
      details can never be read again.** Never change it after sellers sign up.
- Staging should use a **different** key from production.

## 3. Data rules to agree (for Phase 3, live tracking)

- [ ] Rider location is saved only during an active delivery. How long should the trail be kept after
      delivery? (Plan: delete the trail as soon as the order is delivered or cancelled, keep only the
      delivered time and place, for disputes for 30 days.) Confirm or change.
- [ ] Who in the team may read customer and rider personal data in the admin area.

## When done

Tell the owner. The developer then points staging at the new database, checks that all tables are
created, loads the demo store from `/admin/vendors`, and runs the full test list.
