import "server-only";

/**
 * Schema migrations, applied in order on first database use and recorded in
 * `schema_migrations`. Never edit a migration that has shipped — add a new one.
 *
 * Conventions
 *   ids        text, prefixed (ven_, vp_, ord_ …), generated in application code
 *   money      integer rupees, GST inclusive, as everywhere else on the site
 *   times      timestamptz
 *   statuses   text with a CHECK; the allowed values mirror src/lib/vendor/types.ts
 *   secrets    bank account and PAN are stored sealed (AES-256-GCM, src/lib/crypto/sealed.ts);
 *              only the last four characters are stored in the clear
 */
export const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: "001_vendor_marketplace",
    sql: `
CREATE TABLE vendors (
  id                 text PRIMARY KEY,
  email              text NOT NULL,
  mobile             text NOT NULL,
  password_hash      text NOT NULL,
  full_name          text NOT NULL,
  business_type      text NOT NULL,
  status             text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft','submitted','under_review','approved','changes_requested','rejected','suspended')),
  email_verified_at  timestamptz,
  mobile_verified_at timestamptz,
  store_name         text,
  slug               text,
  onboarding         jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step       integer NOT NULL DEFAULT 1,
  completed_steps    integer[] NOT NULL DEFAULT '{}',
  commission_rate    numeric(5,2),
  tier               text CHECK (tier IN ('standard','gold','platinum')),
  holiday_mode       boolean NOT NULL DEFAULT false,
  changes_requested  jsonb,
  rejection_reason   text,
  status_before_suspension text,
  submitted_at       timestamptz,
  approved_at        timestamptz,
  approved_by        text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX vendors_email_key ON vendors (lower(email));
CREATE UNIQUE INDEX vendors_mobile_key ON vendors (mobile);
CREATE UNIQUE INDEX vendors_store_name_key ON vendors (lower(store_name)) WHERE store_name IS NOT NULL;
CREATE UNIQUE INDEX vendors_slug_key ON vendors (slug) WHERE slug IS NOT NULL;
CREATE INDEX vendors_status_idx ON vendors (status);

CREATE TABLE vendor_sessions (
  token_hash   text PRIMARY KEY,
  vendor_id    text NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  user_agent   text
);
CREATE INDEX vendor_sessions_vendor_idx ON vendor_sessions (vendor_id);

CREATE TABLE vendor_otps (
  id          text PRIMARY KEY,
  vendor_id   text REFERENCES vendors(id) ON DELETE CASCADE,
  channel     text NOT NULL CHECK (channel IN ('email','mobile')),
  target      text NOT NULL,
  purpose     text NOT NULL CHECK (purpose IN ('verify','login','reset')),
  code_hash   text NOT NULL,
  attempts    integer NOT NULL DEFAULT 0,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vendor_otps_target_idx ON vendor_otps (target, purpose);

CREATE TABLE rate_limits (
  key          text PRIMARY KEY,
  window_start timestamptz NOT NULL,
  count        integer NOT NULL
);

CREATE TABLE vendor_secrets (
  vendor_id         text PRIMARY KEY REFERENCES vendors(id) ON DELETE CASCADE,
  pan_sealed        text,
  pan_last4         text,
  bank_holder       text,
  bank_account_sealed text,
  bank_account_last4  text,
  bank_ifsc         text,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE files (
  id          text PRIMARY KEY,
  vendor_id   text REFERENCES vendors(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('doc_pan','doc_gst','doc_cheque','doc_trade_license','doc_brand_auth','logo','banner','product_image')),
  mime        text NOT NULL,
  size_bytes  integer NOT NULL,
  data        bytea NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX files_vendor_idx ON files (vendor_id, kind);

CREATE TABLE vendor_products (
  id               text PRIMARY KEY,
  vendor_id        text NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  slug             text NOT NULL UNIQUE,
  status           text NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','pending_review','live','changes_requested','rejected','archived')),
  title            text NOT NULL,
  brand            text NOT NULL,
  department       text NOT NULL,
  group_slug       text NOT NULL,
  sku              text NOT NULL,
  hsn              text,
  gst_rate         integer NOT NULL DEFAULT 18 CHECK (gst_rate IN (0,5,12,18,28)),
  mrp              integer NOT NULL CHECK (mrp > 0),
  price            integer NOT NULL CHECK (price > 0),
  stock            integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  low_stock_at     integer NOT NULL DEFAULT 3 CHECK (low_stock_at >= 0),
  part_type        text NOT NULL DEFAULT 'aftermarket' CHECK (part_type IN ('oem','genuine','aftermarket')),
  warranty_months  integer CHECK (warranty_months >= 0),
  summary          text,
  highlights       jsonb NOT NULL DEFAULT '[]'::jsonb,
  specs            jsonb NOT NULL DEFAULT '[]'::jsonb,
  fitment          jsonb NOT NULL DEFAULT '[]'::jsonb,
  images           jsonb NOT NULL DEFAULT '[]'::jsonb,
  pending_revision jsonb,
  review_notes     jsonb,
  rejection_reason text,
  submitted_at     timestamptz,
  approved_at      timestamptz,
  approved_by      text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CHECK (price <= mrp)
);
CREATE UNIQUE INDEX vendor_products_sku_key ON vendor_products (vendor_id, lower(sku));
CREATE INDEX vendor_products_status_idx ON vendor_products (status);
CREATE INDEX vendor_products_vendor_idx ON vendor_products (vendor_id, status);

CREATE TABLE orders (
  id             text PRIMARY KEY,
  number         text NOT NULL UNIQUE,
  status         text NOT NULL DEFAULT 'placed'
                 CHECK (status IN ('placed','confirmed','completed','cancelled')),
  customer_name  text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  address        text NOT NULL,
  city           text NOT NULL,
  state          text NOT NULL,
  pincode        text NOT NULL,
  notes          text,
  subtotal       integer NOT NULL,
  shipping       integer NOT NULL,
  total          integer NOT NULL,
  channel        text NOT NULL DEFAULT 'whatsapp',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_created_idx ON orders (created_at DESC);

CREATE TABLE vendor_orders (
  id              text PRIMARY KEY,
  order_id        text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  vendor_id       text NOT NULL REFERENCES vendors(id),
  status          text NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new','accepted','packed','shipped','delivered','cancelled','return_requested','returned')),
  subtotal        integer NOT NULL,
  commission_rate numeric(5,2) NOT NULL,
  courier         text,
  tracking_number text,
  cancel_reason   text,
  accepted_at     timestamptz,
  packed_at       timestamptz,
  shipped_at      timestamptz,
  delivered_at    timestamptz,
  cancelled_at    timestamptz,
  returned_at     timestamptz,
  payout_id       text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, vendor_id)
);
CREATE INDEX vendor_orders_vendor_idx ON vendor_orders (vendor_id, status);

CREATE TABLE order_items (
  id              text PRIMARY KEY,
  order_id        text NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  vendor_order_id text REFERENCES vendor_orders(id) ON DELETE CASCADE,
  product_kind    text NOT NULL CHECK (product_kind IN ('house','vendor')),
  product_ref     text NOT NULL,
  title           text NOT NULL,
  variant         text,
  unit_price      integer NOT NULL,
  install_price   integer NOT NULL DEFAULT 0,
  qty             integer NOT NULL CHECK (qty BETWEEN 1 AND 99),
  line_total      integer NOT NULL
);
CREATE INDEX order_items_order_idx ON order_items (order_id);

CREATE TABLE vendor_payouts (
  id            text PRIMARY KEY,
  vendor_id     text NOT NULL REFERENCES vendors(id),
  gross         integer NOT NULL,
  commission    integer NOT NULL,
  commission_gst integer NOT NULL,
  net           integer NOT NULL,
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  reference     text,
  paid_at       timestamptz,
  created_by    text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vendor_payouts_vendor_idx ON vendor_payouts (vendor_id, created_at DESC);

CREATE TABLE vendor_change_requests (
  id          text PRIMARY KEY,
  vendor_id   text NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  kind        text NOT NULL CHECK (kind IN ('bank')),
  payload_sealed text NOT NULL,
  summary     text NOT NULL,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  decided_by  text,
  decided_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id         text PRIMARY KEY,
  vendor_id  text NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  type       text NOT NULL CHECK (type IN ('account','product','order','stock','payout','support')),
  title      text NOT NULL,
  body       text NOT NULL,
  link       text,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_vendor_idx ON notifications (vendor_id, created_at DESC);

CREATE TABLE support_tickets (
  id          text PRIMARY KEY,
  vendor_id   text NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  subject     text NOT NULL,
  body        text NOT NULL,
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','closed')),
  admin_reply text,
  replied_by  text,
  replied_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX support_tickets_vendor_idx ON support_tickets (vendor_id, created_at DESC);

CREATE TABLE audit_log (
  id         bigserial PRIMARY KEY,
  at         timestamptz NOT NULL DEFAULT now(),
  actor_type text NOT NULL CHECK (actor_type IN ('vendor','admin','system','customer')),
  actor      text NOT NULL,
  vendor_id  text,
  action     text NOT NULL,
  detail     jsonb,
  ip         text
);
CREATE INDEX audit_log_vendor_idx ON audit_log (vendor_id, at DESC);
`,
  },
];
