# Vamsi: database and data security

Updated 18 Oct 2026. The app creates and upgrades its own tables on start; nothing to run by hand.
Secrets go only into the hosting dashboard or a password manager.

## Before launch (must do)

1. **Two new, empty PostgreSQL databases**: staging and production.
   - PostgreSQL 16 (14+ works), no extensions needed.
   - Region Mumbai (`ap-south-1`) or nearest to the hosting.
   - A user that can create tables.
   - **Not** the old riderzpro.com database: its table names clash.
2. Give the **pooled** connection string (Neon / Supabase pooler or PgBouncer) as `DATABASE_URL`, e.g.
   `postgres://user:pass@host:5432/riderzpro?sslmode=require`. Optional: `DATABASE_POOL_MAX` (default
   10; 5 suits serverless).
3. **Daily backups with point-in-time restore** switched on for production.
4. **Encryption key** for sellers' bank details and PAN: `openssl rand -base64 32` → `VENDOR_DATA_KEY`.
   - Use a different key for staging and production.
   - Keep a copy in the company password manager. **If it is lost, stored bank details can never be
     read again**; never change it after sellers sign up.
   - The site refuses to start without it.

## Decisions (today's behaviour in brackets)

- Rider location retention [trail kept 30 minutes while delivering and deleted when the job closes;
  a delivered job's last point kept 30 days, then deleted].
- Message log retention (kind and status only, no text) [kept; nothing deletes it].
- Who may see customer and rider personal data in admin [Owner, Manager, Operations and Support
  roles see customers; Operations sees riders].

## When done

Tell the developer. They point staging at the database, check the tables, load the demo store and
re-run the invoice-numbering test on real Postgres.
