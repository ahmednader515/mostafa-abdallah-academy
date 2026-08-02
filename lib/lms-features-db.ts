/**
 * جداول وميزات LMS إضافية (Phase 3–5): كوبونات، تقدم المشاهدة، استشارات،
 * تدريب خارجي، صلاحيات مخصصة.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL غير معرّف");

const sql = neon(connectionString);

const ensureOnceMap = new Map<string, Promise<void>>();
function ensureOnce(key: string, fn: () => Promise<void>): Promise<void> {
  const existing = ensureOnceMap.get(key);
  if (existing) return existing;
  const p = (async () => {
    await fn();
  })();
  ensureOnceMap.set(key, p);
  return p;
}

function generateId(): string {
  const part = () => Math.random().toString(36).slice(2, 10);
  return "c" + part() + part() + Date.now().toString(36).slice(-6);
}

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function rowToCamel<T = Record<string, unknown>>(row: Record<string, unknown> | null | undefined): T | null {
  if (!row) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[snakeToCamel(k)] = v;
  return out as T;
}

function rowsToCamel<T = Record<string, unknown>>(rows: Record<string, unknown>[]): T[] {
  return rows.map((r) => rowToCamel(r) as T);
}

export async function ensureLmsFeaturesSchema(): Promise<void> {
  return ensureOnce("ensureLmsFeaturesSchema", async () => {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "LessonWatchProgress" (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          lesson_id TEXT NOT NULL,
          seconds NUMERIC(12,2) NOT NULL DEFAULT 0,
          percent NUMERIC(5,2) NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(user_id, lesson_id)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS "LessonWatchProgress_user_lesson_idx" ON "LessonWatchProgress"(user_id, lesson_id)`;
    } catch {
      /* noop */
    }

    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "ConsultationOffer" (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          title_ar TEXT,
          description TEXT NOT NULL DEFAULT '',
          description_ar TEXT,
          image_url TEXT,
          schedule_text TEXT,
          schedule_text_ar TEXT,
          price NUMERIC(12,2) NOT NULL DEFAULT 0,
          is_published BOOLEAN NOT NULL DEFAULT false,
          "order" INT NOT NULL DEFAULT 0,
          booking_mode TEXT NOT NULL DEFAULT 'message',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
    } catch {
      /* noop */
    }

    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "PermissionOverride" (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          role TEXT,
          can_create_courses BOOLEAN NOT NULL DEFAULT false,
          can_post_jobs BOOLEAN NOT NULL DEFAULT false,
          can_create_forum_topics BOOLEAN NOT NULL DEFAULT false,
          can_moderate_forum BOOLEAN NOT NULL DEFAULT false,
          can_manage_library BOOLEAN NOT NULL DEFAULT false,
          can_manage_coupons BOOLEAN NOT NULL DEFAULT false,
          flags_json TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS "PermissionOverride_user_idx" ON "PermissionOverride"(user_id)`;
      await sql`CREATE INDEX IF NOT EXISTS "PermissionOverride_role_idx" ON "PermissionOverride"(role)`;
      await sql`ALTER TABLE "PermissionOverride" ADD COLUMN IF NOT EXISTS can_view_analytics BOOLEAN NOT NULL DEFAULT false`;
    } catch {
      /* noop */
    }

    try {
      await sql`ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS staff_last_read_at TIMESTAMPTZ`;
      await sql`ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS student_last_read_at TIMESTAMPTZ`;
    } catch {
      /* noop */
    }

    try {
    await sql`ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS covers_courses BOOLEAN NOT NULL DEFAULT true`;
    await sql`ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS covers_library BOOLEAN NOT NULL DEFAULT true`;
    await sql`ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS covers_external_training BOOLEAN NOT NULL DEFAULT false`;
    await sql`ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS duration_value INT NOT NULL DEFAULT 1`;
    } catch {
      /* noop */
    }

    try {
      await sql`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS country TEXT`;
      await sql`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS country_en TEXT`;
      await sql`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS icons_json TEXT`;
      await sql`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS teacher_image_url TEXT`;
      await sql`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS teacher_description TEXT`;
      await sql`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS teacher_description_en TEXT`;
      await sql`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(12,2)`;
    } catch {
      /* noop */
    }

    try {
      await sql`ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS is_preview BOOLEAN NOT NULL DEFAULT false`;
    } catch {
      /* noop */
    }

    try {
      await sql`ALTER TABLE "StoreProduct" ADD COLUMN IF NOT EXISTS file_kind TEXT`;
    } catch {
      /* noop */
    }

    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "ExternalTrainingPage" (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          title_ar TEXT,
          description TEXT NOT NULL DEFAULT '',
          description_ar TEXT,
          image_url TEXT,
          launch_url TEXT NOT NULL,
          launch_method TEXT NOT NULL DEFAULT 'POST',
          credentials_json TEXT,
          is_published BOOLEAN NOT NULL DEFAULT false,
          "order" INT NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS "ExternalTrainingPage_published_order_idx" ON "ExternalTrainingPage"(is_published, "order")`;
    } catch {
      /* noop */
    }

    try {
      await sql`ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS image_url TEXT`;
      await sql`ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS email TEXT`;
      await sql`ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS phone TEXT`;
      await sql`ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS location_ar TEXT`;
      await sql`ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS location_en TEXT`;
      await sql`ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS job_type_ar TEXT`;
      await sql`ALTER TABLE "JobPosting" ADD COLUMN IF NOT EXISTS job_type_en TEXT`;
    } catch {
      /* noop */
    }

    try {
      await sql`
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
        )
      `;
      await sql`ALTER TABLE "DiscountCoupon" ADD COLUMN IF NOT EXISTS campaign_name TEXT`;
      await sql`ALTER TABLE "DiscountCoupon" ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ`;
      await sql`ALTER TABLE "DiscountCoupon" ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`;
      await sql`ALTER TABLE "DiscountCoupon" ADD COLUMN IF NOT EXISTS max_uses_per_user INT`;
      await sql`ALTER TABLE "DiscountCoupon" ADD COLUMN IF NOT EXISTS target_mode TEXT NOT NULL DEFAULT 'all_in_scope'`;
      await sql`CREATE INDEX IF NOT EXISTS "DiscountCoupon_code_idx" ON "DiscountCoupon"(code)`;
      await sql`
        CREATE TABLE IF NOT EXISTS "DiscountCouponTarget" (
          coupon_id TEXT NOT NULL REFERENCES "DiscountCoupon"(id) ON DELETE CASCADE,
          target_type TEXT NOT NULL,
          target_id TEXT NOT NULL,
          PRIMARY KEY (coupon_id, target_type, target_id)
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS "DiscountCouponRedemption" (
          id TEXT PRIMARY KEY,
          coupon_id TEXT NOT NULL REFERENCES "DiscountCoupon"(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL,
          scope TEXT NOT NULL DEFAULT '',
          target_id TEXT,
          original_price NUMERIC(12,2) NOT NULL DEFAULT 0,
          discounted_price NUMERIC(12,2) NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS "DiscountCouponRedemption_coupon_user_idx" ON "DiscountCouponRedemption"(coupon_id, user_id)`;
    } catch {
      /* noop */
    }
  });
}

// ─── DiscountCoupon ─────────────────────────────────────────────────────────

export type CouponScope = "course" | "library" | "subscription" | "store" | "all";
export type CouponTargetType = "course" | "store_product" | "subscription_plan";

export type DiscountCoupon = {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  amount: number;
  scope: CouponScope;
  usageMode: "fixed" | "unlimited";
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  campaignName: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  maxUsesPerUser: number | null;
  targetMode: "all_in_scope" | "specific";
  targets: Array<{ targetType: CouponTargetType; targetId: string }>;
  createdAt: string;
  updatedAt: string;
};

const COUPON_SCOPES: CouponScope[] = ["course", "library", "subscription", "store", "all"];

function mapCoupon(r: Record<string, unknown>, targets: DiscountCoupon["targets"] = []): DiscountCoupon {
  const scopeRaw = String(r.scope ?? "course");
  return {
    id: String(r.id),
    code: String(r.code ?? ""),
    discountType: r.discount_type === "fixed" ? "fixed" : "percent",
    amount: Number(r.amount ?? 0),
    scope: (COUPON_SCOPES.includes(scopeRaw as CouponScope) ? scopeRaw : "course") as CouponScope,
    usageMode: r.usage_mode === "fixed" ? "fixed" : "unlimited",
    maxUses: r.max_uses != null ? Number(r.max_uses) : null,
    usedCount: Number(r.used_count ?? 0),
    isActive: Boolean(r.is_active),
    campaignName: r.campaign_name != null && String(r.campaign_name).trim() !== "" ? String(r.campaign_name) : null,
    startsAt: r.starts_at instanceof Date ? r.starts_at.toISOString() : r.starts_at != null ? String(r.starts_at) : null,
    expiresAt: r.expires_at instanceof Date ? r.expires_at.toISOString() : r.expires_at != null ? String(r.expires_at) : null,
    maxUsesPerUser: r.max_uses_per_user != null ? Number(r.max_uses_per_user) : null,
    targetMode: String(r.target_mode ?? "all_in_scope") === "specific" ? "specific" : "all_in_scope",
    targets,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at ?? ""),
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at ?? ""),
  };
}

async function loadCouponTargets(couponId: string): Promise<DiscountCoupon["targets"]> {
  try {
    const rows = await sql`
      SELECT target_type, target_id FROM "DiscountCouponTarget" WHERE coupon_id = ${couponId}
    `;
    return (rows as Record<string, unknown>[]).map((t) => ({
      targetType: String(t.target_type) as CouponTargetType,
      targetId: String(t.target_id),
    }));
  } catch {
    return [];
  }
}

async function replaceCouponTargets(
  couponId: string,
  targets: Array<{ targetType: CouponTargetType; targetId: string }>,
): Promise<void> {
  await sql`DELETE FROM "DiscountCouponTarget" WHERE coupon_id = ${couponId}`;
  for (const t of targets) {
    const tid = t.targetId.trim();
    if (!tid) continue;
    await sql`
      INSERT INTO "DiscountCouponTarget" (coupon_id, target_type, target_id)
      VALUES (${couponId}, ${t.targetType}, ${tid})
      ON CONFLICT DO NOTHING
    `;
  }
}

function generateCouponCodeString(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function listDiscountCoupons(): Promise<DiscountCoupon[]> {
  await ensureLmsFeaturesSchema();
  try {
    const rows = await sql`SELECT * FROM "DiscountCoupon" ORDER BY created_at DESC`;
    const out: DiscountCoupon[] = [];
    for (const r of rows as Record<string, unknown>[]) {
      const targets = await loadCouponTargets(String(r.id));
      out.push(mapCoupon(r, targets));
    }
    return out;
  } catch {
    return [];
  }
}

export async function getDiscountCouponByCode(code: string): Promise<DiscountCoupon | null> {
  await ensureLmsFeaturesSchema();
  const c = code.trim().toUpperCase();
  if (!c) return null;
  try {
    const rows = await sql`SELECT * FROM "DiscountCoupon" WHERE UPPER(code) = ${c} LIMIT 1`;
    const r = rows[0] as Record<string, unknown> | undefined;
    if (!r) return null;
    const targets = await loadCouponTargets(String(r.id));
    return mapCoupon(r, targets);
  } catch {
    return null;
  }
}

export type CreateDiscountCouponInput = {
  code?: string;
  discountType: "percent" | "fixed";
  amount: number;
  scope: CouponScope;
  usageMode: "fixed" | "unlimited";
  maxUses?: number | null;
  maxUsesPerUser?: number | null;
  isActive?: boolean;
  campaignName?: string | null;
  startsAt?: string | Date | null;
  expiresAt?: string | Date | null;
  targetMode?: "all_in_scope" | "specific";
  targets?: Array<{ targetType: CouponTargetType; targetId: string }>;
  batchCount?: number;
};

export async function createDiscountCoupon(data: CreateDiscountCouponInput): Promise<DiscountCoupon> {
  const batch = await createDiscountCouponsBatch({ ...data, batchCount: 1 });
  return batch[0];
}

export async function createDiscountCouponsBatch(data: CreateDiscountCouponInput): Promise<DiscountCoupon[]> {
  await ensureLmsFeaturesSchema();
  const n = Math.min(Math.max(Number(data.batchCount) || 1, 1), 200);
  const scope = COUPON_SCOPES.includes(data.scope) ? data.scope : "course";
  const targetMode = data.targetMode === "specific" ? "specific" : "all_in_scope";
  const targets = Array.isArray(data.targets) ? data.targets : [];
  const startsAt =
    data.startsAt != null && String(data.startsAt).trim() !== "" ? new Date(data.startsAt) : null;
  const expiresAt =
    data.expiresAt != null && String(data.expiresAt).trim() !== "" ? new Date(data.expiresAt) : null;
  const maxUsesPerUser =
    data.maxUsesPerUser != null && Number.isFinite(Number(data.maxUsesPerUser))
      ? Math.max(1, Math.floor(Number(data.maxUsesPerUser)))
      : null;
  const maxUses =
    data.usageMode === "fixed"
      ? Math.max(1, Math.floor(Number(data.maxUses) || 1))
      : null;
  const amount = Math.max(0, Number(data.amount) || 0);
  const campaignName = data.campaignName?.trim() || null;
  const created: DiscountCoupon[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < n; i++) {
    let code =
      n === 1 && data.code?.trim()
        ? data.code.trim().toUpperCase()
        : generateCouponCodeString();
    while (seen.has(code)) code = generateCouponCodeString();
    seen.add(code);
    const id = generateId();
    await sql`
      INSERT INTO "DiscountCoupon" (
        id, code, discount_type, amount, scope, usage_mode, max_uses, is_active,
        campaign_name, starts_at, expires_at, max_uses_per_user, target_mode
      )
      VALUES (
        ${id}, ${code}, ${data.discountType === "fixed" ? "fixed" : "percent"}, ${amount}, ${scope},
        ${data.usageMode === "fixed" ? "fixed" : "unlimited"}, ${maxUses},
        ${data.isActive !== false}, ${campaignName}, ${startsAt}, ${expiresAt},
        ${maxUsesPerUser}, ${targetMode}
      )
    `;
    if (targetMode === "specific" && targets.length > 0) {
      await replaceCouponTargets(id, targets);
    }
    const rows = await sql`SELECT * FROM "DiscountCoupon" WHERE id = ${id} LIMIT 1`;
    created.push(mapCoupon(rows[0] as Record<string, unknown>, targetMode === "specific" ? targets : []));
  }
  return created;
}

export async function updateDiscountCoupon(
  id: string,
  data: Partial<{
    code: string;
    discountType: "percent" | "fixed";
    amount: number;
    scope: CouponScope;
    usageMode: "fixed" | "unlimited";
    maxUses: number | null;
    maxUsesPerUser: number | null;
    isActive: boolean;
    campaignName: string | null;
    startsAt: string | Date | null;
    expiresAt: string | Date | null;
    targetMode: "all_in_scope" | "specific";
    targets: Array<{ targetType: CouponTargetType; targetId: string }>;
  }>,
): Promise<void> {
  await ensureLmsFeaturesSchema();
  if (data.code !== undefined)
    await sql`UPDATE "DiscountCoupon" SET code = ${data.code.trim().toUpperCase()}, updated_at = NOW() WHERE id = ${id}`;
  if (data.discountType !== undefined)
    await sql`UPDATE "DiscountCoupon" SET discount_type = ${data.discountType}, updated_at = NOW() WHERE id = ${id}`;
  if (data.amount !== undefined)
    await sql`UPDATE "DiscountCoupon" SET amount = ${data.amount}, updated_at = NOW() WHERE id = ${id}`;
  if (data.scope !== undefined)
    await sql`UPDATE "DiscountCoupon" SET scope = ${data.scope}, updated_at = NOW() WHERE id = ${id}`;
  if (data.usageMode !== undefined)
    await sql`UPDATE "DiscountCoupon" SET usage_mode = ${data.usageMode}, updated_at = NOW() WHERE id = ${id}`;
  if (data.maxUses !== undefined)
    await sql`UPDATE "DiscountCoupon" SET max_uses = ${data.maxUses}, updated_at = NOW() WHERE id = ${id}`;
  if (data.maxUsesPerUser !== undefined)
    await sql`UPDATE "DiscountCoupon" SET max_uses_per_user = ${data.maxUsesPerUser}, updated_at = NOW() WHERE id = ${id}`;
  if (data.isActive !== undefined)
    await sql`UPDATE "DiscountCoupon" SET is_active = ${data.isActive}, updated_at = NOW() WHERE id = ${id}`;
  if (data.campaignName !== undefined)
    await sql`UPDATE "DiscountCoupon" SET campaign_name = ${data.campaignName?.trim() || null}, updated_at = NOW() WHERE id = ${id}`;
  if (data.startsAt !== undefined) {
    const v = data.startsAt != null && String(data.startsAt).trim() !== "" ? new Date(data.startsAt) : null;
    await sql`UPDATE "DiscountCoupon" SET starts_at = ${v}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.expiresAt !== undefined) {
    const v = data.expiresAt != null && String(data.expiresAt).trim() !== "" ? new Date(data.expiresAt) : null;
    await sql`UPDATE "DiscountCoupon" SET expires_at = ${v}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.targetMode !== undefined)
    await sql`UPDATE "DiscountCoupon" SET target_mode = ${data.targetMode}, updated_at = NOW() WHERE id = ${id}`;
  if (data.targets !== undefined) {
    await replaceCouponTargets(id, data.targets);
  }
}

export async function deleteDiscountCoupon(id: string): Promise<void> {
  await ensureLmsFeaturesSchema();
  await sql`DELETE FROM "DiscountCoupon" WHERE id = ${id}`;
}

export type CouponValidation =
  | { ok: true; coupon: DiscountCoupon; discountedPrice: number; originalPrice: number }
  | { ok: false; error: string };

function computeDiscountedPrice(coupon: DiscountCoupon, originalPrice: number): number {
  let discounted = originalPrice;
  if (coupon.discountType === "percent") {
    discounted = Math.max(0, originalPrice * (1 - coupon.amount / 100));
  } else {
    discounted = Math.max(0, originalPrice - coupon.amount);
  }
  return Math.round(discounted * 100) / 100;
}

function scopeMatches(couponScope: CouponScope, purchaseScope: CouponScope): boolean {
  if (couponScope === "all") return true;
  if (purchaseScope === "library" && (couponScope === "library" || couponScope === "store")) return true;
  if (purchaseScope === "store" && (couponScope === "store" || couponScope === "library")) return true;
  return couponScope === purchaseScope;
}

function targetTypeForScope(scope: CouponScope): CouponTargetType | null {
  if (scope === "course") return "course";
  if (scope === "subscription") return "subscription_plan";
  if (scope === "store" || scope === "library") return "store_product";
  return null;
}

export async function validateAndPreviewCoupon(opts: {
  code: string;
  scope: CouponScope;
  originalPrice: number;
  targetId?: string | null;
  userId?: string | null;
}): Promise<CouponValidation> {
  const coupon = await getDiscountCouponByCode(opts.code);
  if (!coupon || !coupon.isActive) return { ok: false, error: "كوبون غير صالح أو غير مفعّل" };
  if (!scopeMatches(coupon.scope, opts.scope)) {
    return { ok: false, error: "هذا الكوبون غير صالح لهذا النوع من المشتريات" };
  }
  const now = Date.now();
  if (coupon.startsAt) {
    const s = new Date(coupon.startsAt).getTime();
    if (!Number.isNaN(s) && now < s) return { ok: false, error: "لم تبدأ صلاحية هذا الكوبون بعد" };
  }
  if (coupon.expiresAt) {
    const e = new Date(coupon.expiresAt).getTime();
    if (!Number.isNaN(e) && now > e) return { ok: false, error: "انتهت صلاحية هذا الكوبون" };
  }
  if (coupon.usageMode === "fixed" && coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, error: "تم استنفاذ مرات استخدام هذا الكوبون" };
  }
  if (coupon.targetMode === "specific") {
    const tid = opts.targetId?.trim();
    if (!tid) return { ok: false, error: "هذا الكوبون مقيّد بمنتجات محددة" };
    const expected = targetTypeForScope(opts.scope);
    const ok = coupon.targets.some(
      (t) => t.targetId === tid && (expected == null || t.targetType === expected || coupon.scope === "all"),
    );
    if (!ok) return { ok: false, error: "هذا الكوبون غير صالح لهذا المنتج" };
  }
  if (opts.userId && coupon.maxUsesPerUser != null) {
    try {
      const rows = await sql`
        SELECT COUNT(*)::int AS c FROM "DiscountCouponRedemption"
        WHERE coupon_id = ${coupon.id} AND user_id = ${opts.userId}
      `;
      const c = Number((rows[0] as { c?: number })?.c ?? 0);
      if (c >= coupon.maxUsesPerUser) {
        return { ok: false, error: "تجاوزت الحد الأقصى لاستخدام هذا الكوبون" };
      }
    } catch {
      /* ignore if table missing */
    }
  }
  const discountedPrice = computeDiscountedPrice(coupon, Math.max(0, opts.originalPrice));
  return {
    ok: true,
    coupon,
    discountedPrice,
    originalPrice: Math.max(0, opts.originalPrice),
  };
}

export async function consumeCoupon(
  couponId: string,
  opts?: {
    userId?: string;
    scope?: string;
    targetId?: string | null;
    originalPrice?: number;
    discountedPrice?: number;
  },
): Promise<void> {
  await ensureLmsFeaturesSchema();
  await sql`
    UPDATE "DiscountCoupon"
    SET used_count = used_count + 1, updated_at = NOW()
    WHERE id = ${couponId}
  `;
  if (opts?.userId) {
    const id = generateId();
    try {
      await sql`
        INSERT INTO "DiscountCouponRedemption" (
          id, coupon_id, user_id, scope, target_id, original_price, discounted_price
        )
        VALUES (
          ${id}, ${couponId}, ${opts.userId}, ${opts.scope ?? ""}, ${opts.targetId ?? null},
          ${opts.originalPrice ?? 0}, ${opts.discountedPrice ?? 0}
        )
      `;
    } catch {
      /* optional */
    }
  }
}

// ─── LessonWatchProgress ────────────────────────────────────────────────────

export type LessonWatchProgress = {
  id: string;
  userId: string;
  lessonId: string;
  seconds: number;
  percent: number;
  updatedAt: string;
};

export async function upsertLessonWatchProgress(data: {
  userId: string;
  lessonId: string;
  seconds: number;
  percent: number;
}): Promise<LessonWatchProgress> {
  await ensureLmsFeaturesSchema();
  const seconds = Math.max(0, Number(data.seconds) || 0);
  const percent = Math.min(100, Math.max(0, Number(data.percent) || 0));
  const existing = await sql`
    SELECT id FROM "LessonWatchProgress"
    WHERE user_id = ${data.userId} AND lesson_id = ${data.lessonId}
    LIMIT 1
  `;
  const row = existing[0] as { id?: string } | undefined;
  if (row?.id) {
    await sql`
      UPDATE "LessonWatchProgress"
      SET seconds = ${seconds}, percent = ${percent}, updated_at = NOW()
      WHERE id = ${row.id}
    `;
    const rows = await sql`SELECT * FROM "LessonWatchProgress" WHERE id = ${row.id} LIMIT 1`;
    return rowToCamel(rows[0] as Record<string, unknown>) as LessonWatchProgress;
  }
  const id = generateId();
  await sql`
    INSERT INTO "LessonWatchProgress" (id, user_id, lesson_id, seconds, percent)
    VALUES (${id}, ${data.userId}, ${data.lessonId}, ${seconds}, ${percent})
  `;
  const rows = await sql`SELECT * FROM "LessonWatchProgress" WHERE id = ${id} LIMIT 1`;
  return rowToCamel(rows[0] as Record<string, unknown>) as LessonWatchProgress;
}

export async function getLessonWatchProgress(
  userId: string,
  lessonId: string,
): Promise<LessonWatchProgress | null> {
  await ensureLmsFeaturesSchema();
  const rows = await sql`
    SELECT * FROM "LessonWatchProgress"
    WHERE user_id = ${userId} AND lesson_id = ${lessonId}
    LIMIT 1
  `;
  const r = rows[0] as Record<string, unknown> | undefined;
  return r ? (rowToCamel(r) as LessonWatchProgress) : null;
}

export async function getCourseWatchProgressPercent(
  userId: string,
  lessonIds: string[],
): Promise<number> {
  if (lessonIds.length === 0) return 0;
  await ensureLmsFeaturesSchema();
  const rows = await sql`
    SELECT AVG(percent)::float AS avg_pct
    FROM "LessonWatchProgress"
    WHERE user_id = ${userId} AND lesson_id = ANY(${lessonIds})
  `;
  const avg = Number((rows[0] as { avg_pct?: number })?.avg_pct ?? 0);
  return Math.round(Math.min(100, Math.max(0, avg)));
}

// ─── ConsultationOffer ──────────────────────────────────────────────────────

export type ConsultationOffer = {
  id: string;
  title: string;
  titleAr: string | null;
  description: string;
  descriptionAr: string | null;
  imageUrl: string | null;
  scheduleText: string | null;
  scheduleTextAr: string | null;
  price: number;
  isPublished: boolean;
  order: number;
  bookingMode: string;
  createdAt: string;
  updatedAt: string;
};

function mapConsultation(r: Record<string, unknown>): ConsultationOffer {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    titleAr: r.title_ar ? String(r.title_ar) : null,
    description: String(r.description ?? ""),
    descriptionAr: r.description_ar ? String(r.description_ar) : null,
    imageUrl: r.image_url ? String(r.image_url) : null,
    scheduleText: r.schedule_text ? String(r.schedule_text) : null,
    scheduleTextAr: r.schedule_text_ar ? String(r.schedule_text_ar) : null,
    price: Number(r.price ?? 0),
    isPublished: Boolean(r.is_published),
    order: Number(r.order ?? 0),
    bookingMode: String(r.booking_mode ?? "message"),
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at ?? ""),
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at ?? ""),
  };
}

export async function listPublishedConsultations(): Promise<ConsultationOffer[]> {
  await ensureLmsFeaturesSchema();
  const rows = await sql`
    SELECT * FROM "ConsultationOffer" WHERE is_published = true
    ORDER BY "order" ASC, created_at DESC
  `;
  return (rows as Record<string, unknown>[]).map(mapConsultation);
}

export async function listAllConsultations(): Promise<ConsultationOffer[]> {
  await ensureLmsFeaturesSchema();
  const rows = await sql`SELECT * FROM "ConsultationOffer" ORDER BY "order" ASC, created_at DESC`;
  return (rows as Record<string, unknown>[]).map(mapConsultation);
}

export async function getConsultationById(id: string): Promise<ConsultationOffer | null> {
  await ensureLmsFeaturesSchema();
  const rows = await sql`SELECT * FROM "ConsultationOffer" WHERE id = ${id} LIMIT 1`;
  const r = rows[0] as Record<string, unknown> | undefined;
  return r ? mapConsultation(r) : null;
}

export async function createConsultation(data: {
  title: string;
  titleAr?: string | null;
  description?: string;
  descriptionAr?: string | null;
  imageUrl?: string | null;
  scheduleText?: string | null;
  scheduleTextAr?: string | null;
  price?: number;
  isPublished?: boolean;
  bookingMode?: string;
}): Promise<ConsultationOffer> {
  await ensureLmsFeaturesSchema();
  const id = generateId();
  const maxRows = await sql`SELECT COALESCE(MAX("order"), -1)::int AS m FROM "ConsultationOffer"`;
  const order = Number((maxRows[0] as { m?: number })?.m ?? -1) + 1;
  await sql`
    INSERT INTO "ConsultationOffer" (
      id, title, title_ar, description, description_ar, image_url,
      schedule_text, schedule_text_ar, price, is_published, "order", booking_mode
    ) VALUES (
      ${id}, ${data.title.trim()}, ${data.titleAr?.trim() || null},
      ${data.description ?? ""}, ${data.descriptionAr?.trim() || null},
      ${data.imageUrl?.trim() || null}, ${data.scheduleText?.trim() || null},
      ${data.scheduleTextAr?.trim() || null}, ${data.price ?? 0},
      ${data.isPublished === true}, ${order}, ${data.bookingMode ?? "message"}
    )
  `;
  const rows = await sql`SELECT * FROM "ConsultationOffer" WHERE id = ${id} LIMIT 1`;
  return mapConsultation(rows[0] as Record<string, unknown>);
}

export async function updateConsultation(
  id: string,
  data: Partial<{
    title: string;
    titleAr: string | null;
    description: string;
    descriptionAr: string | null;
    imageUrl: string | null;
    scheduleText: string | null;
    scheduleTextAr: string | null;
    price: number;
    isPublished: boolean;
    bookingMode: string;
    order: number;
  }>,
): Promise<void> {
  await ensureLmsFeaturesSchema();
  if (data.title !== undefined)
    await sql`UPDATE "ConsultationOffer" SET title = ${data.title.trim()}, updated_at = NOW() WHERE id = ${id}`;
  if (data.titleAr !== undefined)
    await sql`UPDATE "ConsultationOffer" SET title_ar = ${data.titleAr}, updated_at = NOW() WHERE id = ${id}`;
  if (data.description !== undefined)
    await sql`UPDATE "ConsultationOffer" SET description = ${data.description}, updated_at = NOW() WHERE id = ${id}`;
  if (data.descriptionAr !== undefined)
    await sql`UPDATE "ConsultationOffer" SET description_ar = ${data.descriptionAr}, updated_at = NOW() WHERE id = ${id}`;
  if (data.imageUrl !== undefined)
    await sql`UPDATE "ConsultationOffer" SET image_url = ${data.imageUrl}, updated_at = NOW() WHERE id = ${id}`;
  if (data.scheduleText !== undefined)
    await sql`UPDATE "ConsultationOffer" SET schedule_text = ${data.scheduleText}, updated_at = NOW() WHERE id = ${id}`;
  if (data.scheduleTextAr !== undefined)
    await sql`UPDATE "ConsultationOffer" SET schedule_text_ar = ${data.scheduleTextAr}, updated_at = NOW() WHERE id = ${id}`;
  if (data.price !== undefined)
    await sql`UPDATE "ConsultationOffer" SET price = ${data.price}, updated_at = NOW() WHERE id = ${id}`;
  if (data.isPublished !== undefined)
    await sql`UPDATE "ConsultationOffer" SET is_published = ${data.isPublished}, updated_at = NOW() WHERE id = ${id}`;
  if (data.bookingMode !== undefined)
    await sql`UPDATE "ConsultationOffer" SET booking_mode = ${data.bookingMode}, updated_at = NOW() WHERE id = ${id}`;
  if (data.order !== undefined)
    await sql`UPDATE "ConsultationOffer" SET "order" = ${data.order}, updated_at = NOW() WHERE id = ${id}`;
}

export async function deleteConsultation(id: string): Promise<void> {
  await ensureLmsFeaturesSchema();
  await sql`DELETE FROM "ConsultationOffer" WHERE id = ${id}`;
}

// ─── ExternalTrainingPage ───────────────────────────────────────────────────

export type ExternalTrainingPage = {
  id: string;
  title: string;
  titleAr: string | null;
  description: string;
  descriptionAr: string | null;
  imageUrl: string | null;
  launchUrl: string;
  launchMethod: string;
  credentialsJson: string | null;
  isPublished: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

function mapExternal(r: Record<string, unknown>): ExternalTrainingPage {
  return {
    id: String(r.id),
    title: String(r.title ?? ""),
    titleAr: r.title_ar ? String(r.title_ar) : null,
    description: String(r.description ?? ""),
    descriptionAr: r.description_ar ? String(r.description_ar) : null,
    imageUrl: r.image_url ? String(r.image_url) : null,
    launchUrl: String(r.launch_url ?? ""),
    launchMethod: String(r.launch_method ?? "POST"),
    credentialsJson: r.credentials_json ? String(r.credentials_json) : null,
    isPublished: Boolean(r.is_published),
    order: Number(r.order ?? 0),
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at ?? ""),
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at ?? ""),
  };
}

export async function listPublishedExternalTrainings(): Promise<ExternalTrainingPage[]> {
  await ensureLmsFeaturesSchema();
  const rows = await sql`
    SELECT id, title, title_ar, description, description_ar, image_url, launch_url, launch_method,
           is_published, "order", created_at, updated_at
    FROM "ExternalTrainingPage" WHERE is_published = true
    ORDER BY "order" ASC, created_at DESC
  `;
  return (rows as Record<string, unknown>[]).map((r) => mapExternal({ ...r, credentials_json: null }));
}

export async function listAllExternalTrainings(): Promise<ExternalTrainingPage[]> {
  await ensureLmsFeaturesSchema();
  const rows = await sql`SELECT * FROM "ExternalTrainingPage" ORDER BY "order" ASC, created_at DESC`;
  return (rows as Record<string, unknown>[]).map(mapExternal);
}

export async function getExternalTrainingById(id: string): Promise<ExternalTrainingPage | null> {
  await ensureLmsFeaturesSchema();
  const rows = await sql`SELECT * FROM "ExternalTrainingPage" WHERE id = ${id} LIMIT 1`;
  const r = rows[0] as Record<string, unknown> | undefined;
  return r ? mapExternal(r) : null;
}

export async function createExternalTraining(data: {
  title: string;
  titleAr?: string | null;
  description?: string;
  descriptionAr?: string | null;
  imageUrl?: string | null;
  launchUrl: string;
  launchMethod?: string;
  credentialsJson?: string | null;
  isPublished?: boolean;
}): Promise<ExternalTrainingPage> {
  await ensureLmsFeaturesSchema();
  const id = generateId();
  const maxRows = await sql`SELECT COALESCE(MAX("order"), -1)::int AS m FROM "ExternalTrainingPage"`;
  const order = Number((maxRows[0] as { m?: number })?.m ?? -1) + 1;
  await sql`
    INSERT INTO "ExternalTrainingPage" (
      id, title, title_ar, description, description_ar, image_url,
      launch_url, launch_method, credentials_json, is_published, "order"
    ) VALUES (
      ${id}, ${data.title.trim()}, ${data.titleAr?.trim() || null},
      ${data.description ?? ""}, ${data.descriptionAr?.trim() || null},
      ${data.imageUrl?.trim() || null}, ${data.launchUrl.trim()},
      ${data.launchMethod ?? "POST"}, ${data.credentialsJson ?? null},
      ${data.isPublished === true}, ${order}
    )
  `;
  const rows = await sql`SELECT * FROM "ExternalTrainingPage" WHERE id = ${id} LIMIT 1`;
  return mapExternal(rows[0] as Record<string, unknown>);
}

export async function updateExternalTraining(
  id: string,
  data: Partial<{
    title: string;
    titleAr: string | null;
    description: string;
    descriptionAr: string | null;
    imageUrl: string | null;
    launchUrl: string;
    launchMethod: string;
    credentialsJson: string | null;
    isPublished: boolean;
    order: number;
  }>,
): Promise<void> {
  await ensureLmsFeaturesSchema();
  if (data.title !== undefined)
    await sql`UPDATE "ExternalTrainingPage" SET title = ${data.title.trim()}, updated_at = NOW() WHERE id = ${id}`;
  if (data.titleAr !== undefined)
    await sql`UPDATE "ExternalTrainingPage" SET title_ar = ${data.titleAr}, updated_at = NOW() WHERE id = ${id}`;
  if (data.description !== undefined)
    await sql`UPDATE "ExternalTrainingPage" SET description = ${data.description}, updated_at = NOW() WHERE id = ${id}`;
  if (data.descriptionAr !== undefined)
    await sql`UPDATE "ExternalTrainingPage" SET description_ar = ${data.descriptionAr}, updated_at = NOW() WHERE id = ${id}`;
  if (data.imageUrl !== undefined)
    await sql`UPDATE "ExternalTrainingPage" SET image_url = ${data.imageUrl}, updated_at = NOW() WHERE id = ${id}`;
  if (data.launchUrl !== undefined)
    await sql`UPDATE "ExternalTrainingPage" SET launch_url = ${data.launchUrl}, updated_at = NOW() WHERE id = ${id}`;
  if (data.launchMethod !== undefined)
    await sql`UPDATE "ExternalTrainingPage" SET launch_method = ${data.launchMethod}, updated_at = NOW() WHERE id = ${id}`;
  if (data.credentialsJson !== undefined)
    await sql`UPDATE "ExternalTrainingPage" SET credentials_json = ${data.credentialsJson}, updated_at = NOW() WHERE id = ${id}`;
  if (data.isPublished !== undefined)
    await sql`UPDATE "ExternalTrainingPage" SET is_published = ${data.isPublished}, updated_at = NOW() WHERE id = ${id}`;
  if (data.order !== undefined)
    await sql`UPDATE "ExternalTrainingPage" SET "order" = ${data.order}, updated_at = NOW() WHERE id = ${id}`;
}

export async function deleteExternalTraining(id: string): Promise<void> {
  await ensureLmsFeaturesSchema();
  await sql`DELETE FROM "ExternalTrainingPage" WHERE id = ${id}`;
}

// ─── PermissionOverride ─────────────────────────────────────────────────────

export type PermissionFlags = {
  canCreateCourses: boolean;
  canPostJobs: boolean;
  canCreateForumTopics: boolean;
  canModerateForum: boolean;
  canManageLibrary: boolean;
  canManageCoupons: boolean;
  canViewAnalytics: boolean;
};

export type PermissionOverride = PermissionFlags & {
  id: string;
  userId: string | null;
  role: string | null;
  flagsJson: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapPerm(r: Record<string, unknown>): PermissionOverride {
  return {
    id: String(r.id),
    userId: r.user_id ? String(r.user_id) : null,
    role: r.role ? String(r.role) : null,
    canCreateCourses: Boolean(r.can_create_courses),
    canPostJobs: Boolean(r.can_post_jobs),
    canCreateForumTopics: Boolean(r.can_create_forum_topics),
    canModerateForum: Boolean(r.can_moderate_forum),
    canManageLibrary: Boolean(r.can_manage_library),
    canManageCoupons: Boolean(r.can_manage_coupons),
    canViewAnalytics: Boolean(r.can_view_analytics),
    flagsJson: r.flags_json ? String(r.flags_json) : null,
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at ?? ""),
    updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at ?? ""),
  };
}

export async function listPermissionOverrides(): Promise<PermissionOverride[]> {
  await ensureLmsFeaturesSchema();
  const rows = await sql`SELECT * FROM "PermissionOverride" ORDER BY updated_at DESC`;
  return (rows as Record<string, unknown>[]).map(mapPerm);
}

export async function getEffectivePermissions(
  userId: string,
  role: string,
): Promise<PermissionFlags> {
  await ensureLmsFeaturesSchema();
  const defaults: PermissionFlags = {
    canCreateCourses: role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER",
    canPostJobs: role === "ADMIN" || role === "ASSISTANT_ADMIN",
    canCreateForumTopics: true,
    canModerateForum: role === "ADMIN" || role === "ASSISTANT_ADMIN",
    canManageLibrary: role === "ADMIN" || role === "ASSISTANT_ADMIN",
    canManageCoupons: role === "ADMIN" || role === "ASSISTANT_ADMIN",
    canViewAnalytics: role === "ADMIN",
  };
  try {
    const rows = await sql`
      SELECT * FROM "PermissionOverride"
      WHERE user_id = ${userId} OR role = ${role}
      ORDER BY CASE WHEN user_id = ${userId} THEN 0 ELSE 1 END
    `;
    for (const raw of rows as Record<string, unknown>[]) {
      const p = mapPerm(raw);
      if (p.canCreateCourses) defaults.canCreateCourses = true;
      if (p.canPostJobs) defaults.canPostJobs = true;
      if (p.canCreateForumTopics) defaults.canCreateForumTopics = true;
      if (p.canModerateForum) defaults.canModerateForum = true;
      if (p.canManageLibrary) defaults.canManageLibrary = true;
      if (p.canManageCoupons) defaults.canManageCoupons = true;
      if (p.canViewAnalytics) defaults.canViewAnalytics = true;
      if (p.userId === userId) {
        defaults.canCreateCourses = p.canCreateCourses;
        defaults.canPostJobs = p.canPostJobs;
        defaults.canCreateForumTopics = p.canCreateForumTopics;
        defaults.canModerateForum = p.canModerateForum;
        defaults.canManageLibrary = p.canManageLibrary;
        defaults.canManageCoupons = p.canManageCoupons;
        defaults.canViewAnalytics = p.canViewAnalytics;
        break;
      }
    }
  } catch {
    /* schema not ready */
  }
  return defaults;
}

export async function upsertPermissionOverride(data: {
  userId?: string | null;
  role?: string | null;
} & Partial<PermissionFlags>): Promise<PermissionOverride> {
  await ensureLmsFeaturesSchema();
  const userId = data.userId?.trim() || null;
  const role = data.role?.trim() || null;
  if (!userId && !role) throw new Error("userId or role required");

  let existing: Record<string, unknown> | undefined;
  if (userId) {
    const rows = await sql`SELECT * FROM "PermissionOverride" WHERE user_id = ${userId} LIMIT 1`;
    existing = rows[0] as Record<string, unknown> | undefined;
  } else if (role) {
    const rows = await sql`SELECT * FROM "PermissionOverride" WHERE role = ${role} AND user_id IS NULL LIMIT 1`;
    existing = rows[0] as Record<string, unknown> | undefined;
  }

  const flags = {
    canCreateCourses: data.canCreateCourses ?? false,
    canPostJobs: data.canPostJobs ?? false,
    canCreateForumTopics: data.canCreateForumTopics ?? false,
    canModerateForum: data.canModerateForum ?? false,
    canManageLibrary: data.canManageLibrary ?? false,
    canManageCoupons: data.canManageCoupons ?? false,
    canViewAnalytics: data.canViewAnalytics ?? false,
  };

  if (existing?.id) {
    const id = String(existing.id);
    await sql`
      UPDATE "PermissionOverride" SET
        can_create_courses = ${flags.canCreateCourses},
        can_post_jobs = ${flags.canPostJobs},
        can_create_forum_topics = ${flags.canCreateForumTopics},
        can_moderate_forum = ${flags.canModerateForum},
        can_manage_library = ${flags.canManageLibrary},
        can_manage_coupons = ${flags.canManageCoupons},
        can_view_analytics = ${flags.canViewAnalytics},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    const rows = await sql`SELECT * FROM "PermissionOverride" WHERE id = ${id} LIMIT 1`;
    return mapPerm(rows[0] as Record<string, unknown>);
  }

  const id = generateId();
  await sql`
    INSERT INTO "PermissionOverride" (
      id, user_id, role, can_create_courses, can_post_jobs, can_create_forum_topics,
      can_moderate_forum, can_manage_library, can_manage_coupons, can_view_analytics
    ) VALUES (
      ${id}, ${userId}, ${role}, ${flags.canCreateCourses}, ${flags.canPostJobs},
      ${flags.canCreateForumTopics}, ${flags.canModerateForum},
      ${flags.canManageLibrary}, ${flags.canManageCoupons}, ${flags.canViewAnalytics}
    )
  `;
  const rows = await sql`SELECT * FROM "PermissionOverride" WHERE id = ${id} LIMIT 1`;
  return mapPerm(rows[0] as Record<string, unknown>);
}

export async function deletePermissionOverride(id: string): Promise<void> {
  await ensureLmsFeaturesSchema();
  await sql`DELETE FROM "PermissionOverride" WHERE id = ${id}`;
}

/** حالة صلاحيات مستخدم محدد: الفعّالة + هل يوجد تجاوز على مستوى الحساب */
export async function getUserPermissionState(
  userId: string,
  role: string,
): Promise<{
  flags: PermissionFlags;
  hasUserOverride: boolean;
  overrideId: string | null;
}> {
  await ensureLmsFeaturesSchema();
  const flags = await getEffectivePermissions(userId, role);
  try {
    const rows = await sql`
      SELECT id FROM "PermissionOverride" WHERE user_id = ${userId} LIMIT 1
    `;
    const id = (rows[0] as { id?: string } | undefined)?.id;
    return {
      flags,
      hasUserOverride: !!id,
      overrideId: id ? String(id) : null,
    };
  } catch {
    return { flags, hasUserOverride: false, overrideId: null };
  }
}

// ─── Message unread helpers ─────────────────────────────────────────────────

export async function getUnreadMessageCount(userId: string, role: string): Promise<number> {
  await ensureLmsFeaturesSchema();
  const isStaff = role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER";
  try {
    if (isStaff) {
      const rows = await sql`
        SELECT COUNT(*)::int AS c
        FROM "Message" m
        JOIN "Conversation" c ON c.id = m.conversation_id
        WHERE c.staff_user_id = ${userId}
          AND m.sender_id <> ${userId}
          AND (c.staff_last_read_at IS NULL OR m.created_at > c.staff_last_read_at)
      `;
      return Number((rows[0] as { c?: number })?.c ?? 0);
    }
    const rows = await sql`
      SELECT COUNT(*)::int AS c
      FROM "Message" m
      JOIN "Conversation" c ON c.id = m.conversation_id
      WHERE c.student_user_id = ${userId}
        AND m.sender_id <> ${userId}
        AND (c.student_last_read_at IS NULL OR m.created_at > c.student_last_read_at)
    `;
    return Number((rows[0] as { c?: number })?.c ?? 0);
  } catch {
    return 0;
  }
}

export async function markConversationRead(
  conversationId: string,
  userId: string,
  role: string,
): Promise<void> {
  await ensureLmsFeaturesSchema();
  const isStaff = role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER";
  if (isStaff) {
    await sql`
      UPDATE "Conversation" SET staff_last_read_at = NOW(), updated_at = NOW()
      WHERE id = ${conversationId} AND staff_user_id = ${userId}
    `;
  } else {
    await sql`
      UPDATE "Conversation" SET student_last_read_at = NOW(), updated_at = NOW()
      WHERE id = ${conversationId} AND student_user_id = ${userId}
    `;
  }
}

export { generateId, rowsToCamel, rowToCamel };
