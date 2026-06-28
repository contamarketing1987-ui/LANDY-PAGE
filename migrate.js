/**
 * @file config/migrate.js
 * @description Creates all database tables for CupomZap.
 * Run: node src/config/migrate.js
 */

require('dotenv').config();
const { pool } = require('./database');
const logger = require('../utils/logger');

const migrations = [
  // ── Users
  `CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(120) NOT NULL,
    email       VARCHAR(200) NOT NULL UNIQUE,
    password    VARCHAR(255),
    provider    VARCHAR(20) DEFAULT 'local' CHECK (provider IN ('local','google','facebook')),
    provider_id VARCHAR(200),
    avatar_url  TEXT,
    role        VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user','admin','editor')),
    cashback_balance DECIMAL(10,2) DEFAULT 0.00,
    total_saved DECIMAL(10,2) DEFAULT 0.00,
    is_active   BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verify_token VARCHAR(200),
    reset_password_token VARCHAR(200),
    reset_password_expires TIMESTAMPTZ,
    last_login  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Categories
  `CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(80) NOT NULL,
    slug        VARCHAR(80) NOT NULL UNIQUE,
    description TEXT,
    icon        VARCHAR(10),
    color       VARCHAR(20),
    sort_order  INTEGER DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Stores
  `CREATE TABLE IF NOT EXISTS stores (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name         VARCHAR(120) NOT NULL,
    slug         VARCHAR(120) NOT NULL UNIQUE,
    description  TEXT,
    logo_url     TEXT,
    website_url  TEXT NOT NULL,
    affiliate_url TEXT,
    affiliate_network VARCHAR(50),
    affiliate_id VARCHAR(200),
    cashback_rate DECIMAL(5,2) DEFAULT 0.00,
    is_featured  BOOLEAN DEFAULT FALSE,
    is_active    BOOLEAN DEFAULT TRUE,
    category_id  INTEGER REFERENCES categories(id),
    meta_title   VARCHAR(200),
    meta_description TEXT,
    total_coupons INTEGER DEFAULT 0,
    total_clicks  INTEGER DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Coupons
  `CREATE TABLE IF NOT EXISTS coupons (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id     UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id  INTEGER REFERENCES categories(id),
    title        VARCHAR(200) NOT NULL,
    description  TEXT,
    code         VARCHAR(100),
    type         VARCHAR(20) DEFAULT 'coupon' CHECK (type IN ('coupon','deal','cashback','frete_gratis')),
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage','fixed','cashback_pct','cashback_fixed')),
    discount_value DECIMAL(10,2),
    min_purchase DECIMAL(10,2),
    max_discount  DECIMAL(10,2),
    terms        TEXT,
    url          TEXT,
    is_exclusive BOOLEAN DEFAULT FALSE,
    is_verified  BOOLEAN DEFAULT FALSE,
    is_featured  BOOLEAN DEFAULT FALSE,
    is_active    BOOLEAN DEFAULT TRUE,
    badge        VARCHAR(30),
    starts_at    TIMESTAMPTZ,
    expires_at   TIMESTAMPTZ,
    verified_at  TIMESTAMPTZ,
    last_checked TIMESTAMPTZ,
    uses_count   INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 100.00,
    created_by   UUID REFERENCES users(id),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Coupon votes (thumbs up/down)
  `CREATE TABLE IF NOT EXISTS coupon_votes (
    id         SERIAL PRIMARY KEY,
    coupon_id  UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id    UUID REFERENCES users(id),
    user_ip    INET,
    vote       SMALLINT NOT NULL CHECK (vote IN (1,-1)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(coupon_id, user_id),
    UNIQUE(coupon_id, user_ip)
  )`,

  // ── Coupon uses / click tracking
  `CREATE TABLE IF NOT EXISTS coupon_uses (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id  UUID NOT NULL REFERENCES coupons(id),
    user_id    UUID REFERENCES users(id),
    user_ip    INET,
    user_agent TEXT,
    referrer   TEXT,
    success    BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Cashback transactions
  `CREATE TABLE IF NOT EXISTS cashback_transactions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id),
    store_id       UUID NOT NULL REFERENCES stores(id),
    coupon_id      UUID REFERENCES coupons(id),
    affiliate_transaction_id VARCHAR(200),
    amount         DECIMAL(10,2) NOT NULL,
    cashback_rate  DECIMAL(5,2) NOT NULL,
    cashback_amount DECIMAL(10,2) NOT NULL,
    status         VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','paid','rejected','cancelled')),
    purchase_date  TIMESTAMPTZ,
    confirmed_at   TIMESTAMPTZ,
    paid_at        TIMESTAMPTZ,
    notes          TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Cashback withdrawals
  `CREATE TABLE IF NOT EXISTS cashback_withdrawals (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id),
    amount       DECIMAL(10,2) NOT NULL,
    method       VARCHAR(20) DEFAULT 'pix' CHECK (method IN ('pix','bank_transfer')),
    pix_key      VARCHAR(200),
    bank_details JSONB,
    status       VARCHAR(20) DEFAULT 'requested' CHECK (status IN ('requested','processing','completed','rejected')),
    processed_at TIMESTAMPTZ,
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Price alerts
  `CREATE TABLE IF NOT EXISTS price_alerts (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id),
    store_id     UUID REFERENCES stores(id),
    product_url  TEXT NOT NULL,
    product_name VARCHAR(200),
    target_price DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2),
    last_price   DECIMAL(10,2),
    is_triggered BOOLEAN DEFAULT FALSE,
    is_active    BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── User favorites
  `CREATE TABLE IF NOT EXISTS user_favorites (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    coupon_id  UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, coupon_id)
  )`,

  // ── Notifications
  `CREATE TABLE IF NOT EXISTS notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(50) NOT NULL,
    title      VARCHAR(200) NOT NULL,
    body       TEXT,
    data       JSONB,
    is_read    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Affiliate networks config
  `CREATE TABLE IF NOT EXISTS affiliate_networks (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(80) NOT NULL,
    slug         VARCHAR(80) NOT NULL UNIQUE,
    api_endpoint TEXT,
    credentials  JSONB,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMPTZ DEFAULT NOW()
  )`,

  // ── Indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_coupons_store_id ON coupons(store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_coupons_category_id ON coupons(category_id)`,
  `CREATE INDEX IF NOT EXISTS idx_coupons_type ON coupons(type)`,
  `CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active)`,
  `CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON coupons(expires_at)`,
  `CREATE INDEX IF NOT EXISTS idx_coupons_is_featured ON coupons(is_featured)`,
  `CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon_id ON coupon_uses(coupon_id)`,
  `CREATE INDEX IF NOT EXISTS idx_coupon_uses_user_id ON coupon_uses(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_cashback_user_id ON cashback_transactions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read)`,
  `CREATE INDEX IF NOT EXISTS idx_stores_slug ON stores(slug)`,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,

  // ── Full-text search index
  `CREATE INDEX IF NOT EXISTS idx_coupons_fts ON coupons
    USING GIN(to_tsvector('portuguese', title || ' ' || COALESCE(description,'')))`,

  // ── Auto-update updated_at trigger function
  `CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql`,

  ...['users','stores','coupons','cashback_transactions','cashback_withdrawals','price_alerts'].map(t =>
    `DROP TRIGGER IF EXISTS trg_${t}_updated_at ON ${t};
     CREATE TRIGGER trg_${t}_updated_at
       BEFORE UPDATE ON ${t}
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()`
  ),
];

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const sql of migrations) {
      await client.query(sql);
    }
    await client.query('COMMIT');
    logger.info('✅ All migrations executed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Migration failed', { error: err.message });
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
