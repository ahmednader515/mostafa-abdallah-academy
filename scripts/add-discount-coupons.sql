-- كوبونات وخصومات (سعر فقط — ليست تفعيل مجاني)
CREATE TABLE IF NOT EXISTS "DiscountCoupon" (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percent',
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  scope TEXT NOT NULL DEFAULT 'course',
  usage_mode TEXT NOT NULL DEFAULT 'unlimited',
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  campaign_name TEXT,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  max_uses_per_user INT,
  target_mode TEXT NOT NULL DEFAULT 'all_in_scope',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE "DiscountCoupon" ADD COLUMN IF NOT EXISTS campaign_name TEXT;
ALTER TABLE "DiscountCoupon" ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE "DiscountCoupon" ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE "DiscountCoupon" ADD COLUMN IF NOT EXISTS max_uses_per_user INT;
ALTER TABLE "DiscountCoupon" ADD COLUMN IF NOT EXISTS target_mode TEXT NOT NULL DEFAULT 'all_in_scope';

CREATE INDEX IF NOT EXISTS "DiscountCoupon_code_idx" ON "DiscountCoupon"(code);

CREATE TABLE IF NOT EXISTS "DiscountCouponTarget" (
  coupon_id TEXT NOT NULL REFERENCES "DiscountCoupon"(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  PRIMARY KEY (coupon_id, target_type, target_id)
);

CREATE TABLE IF NOT EXISTS "DiscountCouponRedemption" (
  id TEXT PRIMARY KEY,
  coupon_id TEXT NOT NULL REFERENCES "DiscountCoupon"(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT '',
  target_id TEXT,
  original_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discounted_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "DiscountCouponRedemption_coupon_user_idx" ON "DiscountCouponRedemption"(coupon_id, user_id);
