/**
 * طبقة بيانات إضافية لإكمال مواصفات المنصة (LMS Spec) — Phase 1-5.
 *
 * ملف مستقل بعميل Neon خاص به (بدون استيراد من lib/db.ts) لتجنّب أي حلقة استيراد.
 * يتبع نفس أنماط lib/db.ts: sql tagged template، ensureOnce، generateId، rowToCamel.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import type {
  PlatformLabel,
  PaymentMethod,
  Notification,
  Certificate,
  HomepageSection,
  SocialLink,
  Category,
  CourseAccessType,
  LiveStreamProvider,
  LiveStreamAccessMode,
  SubscriptionDurationKind,
} from "./types";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL غير معرّف");

/** عميل Neon مستقل لهذا الملف */
export const sql = neon(connectionString);

// ----- أدوات مشتركة (نفس أسلوب lib/db.ts) -----
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

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function rowToCamel<T = Record<string, unknown>>(row: Record<string, unknown> | null | undefined): T | null {
  if (!row) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[snakeToCamel(k)] = v;
  }
  return out as T;
}

function rowsToCamel<T = Record<string, unknown>>(rows: Record<string, unknown>[]): T[] {
  return rows.map((r) => rowToCamel(r) as T);
}

/** توليد معرّف فريد متوافق مع CUID (نفس أسلوب lib/db.ts) */
function generateId(): string {
  const part = () => Math.random().toString(36).slice(2, 10);
  return "c" + part() + part() + Date.now().toString(36).slice(-6);
}

// ============================================================
// إنشاء/تحديث المخطط (Schema) — يُستدعى مرة واحدة لكل عملية سيرفر
// ============================================================
export async function ensureLmsSpecSchema(): Promise<void> {
  return ensureOnce("ensureLmsSpecSchema", async () => {
    // 1) PlatformLabel
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "PlatformLabel" (
          key         TEXT PRIMARY KEY,
          value_ar    TEXT NOT NULL,
          value_en    TEXT NOT NULL,
          group_name  TEXT NOT NULL DEFAULT 'general',
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await seedDefaultPlatformLabelsIfEmpty();
    } catch {
      /* بدون صلاحية CREATE */
    }

    // 2) Category
    try {
      await sql`ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES "Category"(id) ON DELETE SET NULL`;
      await sql`ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true`;
      await sql`ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false`;
      await sql`ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS pin_order INT`;
    } catch {
      /* noop */
    }

    // 3) Course
    try {
      await sql`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS access_type TEXT NOT NULL DEFAULT 'lifetime'`;
      await sql`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS access_duration_days INT`;
      await sql`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true`;
      await sql`ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS delivery_mode TEXT NOT NULL DEFAULT 'recorded'`;
    } catch {
      /* noop */
    }

    // 4) Lesson
    try {
      await sql`ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true`;
      await sql`ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ`;
    } catch {
      /* noop */
    }

    // 5) Enrollment
    try {
      await sql`ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ`;
      await sql`ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`;
    } catch {
      /* noop */
    }

    // 6) LiveStream
    try {
      await sql`ALTER TABLE "LiveStream" ALTER COLUMN course_id DROP NOT NULL`;
    } catch {
      /* قد تفشل لو القيد غير موجود بالفعل أو بدون صلاحية */
    }
    try {
      await sql`ALTER TABLE "LiveStream" ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES "Category"(id) ON DELETE SET NULL`;
      await sql`ALTER TABLE "LiveStream" ADD COLUMN IF NOT EXISTS duration_minutes INT`;
      await sql`ALTER TABLE "LiveStream" ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN NOT NULL DEFAULT false`;
      await sql`ALTER TABLE "LiveStream" ADD COLUMN IF NOT EXISTS access_mode TEXT NOT NULL DEFAULT 'course_enrolled'`;
      await sql`ALTER TABLE "LiveStream" ADD COLUMN IF NOT EXISTS recording_url TEXT`;
    } catch {
      /* noop */
    }

    // 7) Quiz
    try {
      await sql`ALTER TABLE "Quiz" ADD COLUMN IF NOT EXISTS passing_score INT`;
    } catch {
      /* noop */
    }

    // 8) PaymentMethod
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "PaymentMethod" (
          id                TEXT PRIMARY KEY,
          type              TEXT NOT NULL,
          name              TEXT NOT NULL,
          name_ar           TEXT,
          account_details   TEXT,
          instructions      TEXT,
          instructions_en   TEXT,
          config_json       TEXT,
          is_enabled        BOOLEAN NOT NULL DEFAULT true,
          "order"           INT NOT NULL DEFAULT 0,
          created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await seedDefaultPaymentMethodsIfEmpty();
    } catch {
      /* noop */
    }

    // 9) Notification
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "Notification" (
          id         TEXT PRIMARY KEY,
          user_id    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
          type       TEXT NOT NULL,
          title      TEXT NOT NULL,
          body       TEXT,
          link       TEXT,
          read_at    TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS "Notification_user_id_idx" ON "Notification"(user_id, created_at DESC)`;
    } catch {
      /* noop */
    }

    // 10) Certificate
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "Certificate" (
          id             TEXT PRIMARY KEY,
          certificate_id TEXT NOT NULL UNIQUE,
          user_id        TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
          course_id      TEXT NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
          quiz_id        TEXT REFERENCES "Quiz"(id) ON DELETE SET NULL,
          attempt_id     TEXT,
          student_name   TEXT NOT NULL,
          course_title   TEXT NOT NULL,
          score          INT,
          issued_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS "Certificate_user_id_idx" ON "Certificate"(user_id, issued_at DESC)`;
    } catch {
      /* noop */
    }

    // 10b) CertificateDesignSetting — تصميم الشهادة القابل للتخصيص من لوحة التحكم
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "CertificateDesignSetting" (
          id                  TEXT PRIMARY KEY DEFAULT 'default',
          primary_color       TEXT,
          accent_color        TEXT,
          gold_color          TEXT,
          title_ar            TEXT,
          title_en            TEXT,
          eyebrow_ar          TEXT,
          eyebrow_en          TEXT,
          logo_url            TEXT,
          signature_url       TEXT,
          signature_label_ar  TEXT,
          signature_label_en  TEXT,
          show_score          BOOLEAN NOT NULL DEFAULT true,
          show_pattern        BOOLEAN NOT NULL DEFAULT true,
          border_width        INT NOT NULL DEFAULT 6,
          updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await sql`
        INSERT INTO "CertificateDesignSetting" (id)
        VALUES ('default')
        ON CONFLICT (id) DO NOTHING
      `;
    } catch {
      /* noop */
    }

    // 11) HomepageSection
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "HomepageSection" (
          id           TEXT PRIMARY KEY,
          section_type TEXT NOT NULL,
          title        TEXT,
          title_en     TEXT,
          icon         TEXT,
          config_json  TEXT,
          "order"      INT NOT NULL DEFAULT 0,
          is_visible   BOOLEAN NOT NULL DEFAULT true,
          is_pinned    BOOLEAN NOT NULL DEFAULT false,
          created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await seedDefaultHomepageSectionsIfEmpty();
    } catch {
      /* noop */
    }

    // 12) SocialLink
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS "SocialLink" (
          id         TEXT PRIMARY KEY,
          network    TEXT NOT NULL,
          label      TEXT,
          label_en   TEXT,
          url        TEXT NOT NULL,
          is_enabled BOOLEAN NOT NULL DEFAULT true,
          "order"    INT NOT NULL DEFAULT 0
        )
      `;
    } catch {
      /* noop */
    }

    // 13) HomepageSetting: هوية بصرية + تحليلات
    try {
      await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS secondary_color TEXT`;
      await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS accent_color TEXT`;
      await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS background_color TEXT`;
      await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS favicon_url TEXT`;
      await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS ga4_id TEXT`;
      await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS gtm_id TEXT`;
      await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT`;
    } catch {
      /* noop */
    }

    // 14) SubscriptionPlan.duration_value
    try {
      await sql`ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS duration_value INT NOT NULL DEFAULT 1`;
    } catch {
      /* noop — الجدول قد لا يكون موجوداً بعد (ensurePlatformSubscriptionSchema في db.ts ينشئه) */
    }
  });
}

// ============================================================
// مسميات المنصة (PlatformLabel)
// ============================================================
const DEFAULT_PLATFORM_LABELS: { key: string; valueAr: string; valueEn: string; groupName: string }[] = [
  { key: "lesson", valueAr: "محاضرة", valueEn: "Lecture", groupName: "content" },
  { key: "lessons", valueAr: "المحاضرات", valueEn: "Lectures", groupName: "content" },
  { key: "student", valueAr: "متدرب", valueEn: "Trainee", groupName: "users" },
  { key: "students", valueAr: "المتدربون", valueEn: "Trainees", groupName: "users" },
  { key: "course", valueAr: "كورس", valueEn: "Course", groupName: "content" },
  { key: "courses", valueAr: "الكورسات", valueEn: "Courses", groupName: "content" },
  { key: "material", valueAr: "ملزمة", valueEn: "Material", groupName: "content" },
  { key: "materials", valueAr: "الملازم", valueEn: "Materials", groupName: "content" },
  { key: "quiz", valueAr: "اختبار", valueEn: "Quiz", groupName: "content" },
  { key: "quizzes", valueAr: "الاختبارات", valueEn: "Quizzes", groupName: "content" },
  { key: "section", valueAr: "قسم", valueEn: "Section", groupName: "content" },
  { key: "sections", valueAr: "الأقسام", valueEn: "Sections", groupName: "content" },
  { key: "teacher", valueAr: "مدرب", valueEn: "Trainer", groupName: "users" },
  { key: "teachers", valueAr: "المدربون", valueEn: "Trainers", groupName: "users" },
  { key: "homework", valueAr: "واجب", valueEn: "Homework", groupName: "content" },
  { key: "library", valueAr: "المكتبة", valueEn: "Library", groupName: "content" },
];

async function seedDefaultPlatformLabelsIfEmpty(): Promise<void> {
  const existing = await sql`SELECT 1 FROM "PlatformLabel" LIMIT 1`;
  if ((existing as unknown[]).length > 0) return;
  for (const l of DEFAULT_PLATFORM_LABELS) {
    await sql`
      INSERT INTO "PlatformLabel" (key, value_ar, value_en, group_name)
      VALUES (${l.key}, ${l.valueAr}, ${l.valueEn}, ${l.groupName})
      ON CONFLICT (key) DO NOTHING
    `;
  }
}

export async function getAllPlatformLabels(): Promise<PlatformLabel[]> {
  await ensureLmsSpecSchema();
  const rows = await sql`SELECT * FROM "PlatformLabel" ORDER BY group_name ASC, key ASC`;
  return rowsToCamel<PlatformLabel>(rows as Record<string, unknown>[]);
}

/** خريطة key -> {ar,en} لسهولة الاستخدام في الواجهة */
export async function getPlatformLabelsMap(): Promise<Record<string, { ar: string; en: string }>> {
  const labels = await getAllPlatformLabels();
  const map: Record<string, { ar: string; en: string }> = {};
  for (const l of labels) map[l.key] = { ar: l.valueAr, en: l.valueEn };
  return map;
}

export async function upsertPlatformLabel(key: string, valueAr: string, valueEn: string, groupName = "general"): Promise<void> {
  await ensureLmsSpecSchema();
  await sql`
    INSERT INTO "PlatformLabel" (key, value_ar, value_en, group_name, updated_at)
    VALUES (${key.trim()}, ${valueAr}, ${valueEn}, ${groupName}, NOW())
    ON CONFLICT (key) DO UPDATE SET
      value_ar = EXCLUDED.value_ar,
      value_en = EXCLUDED.value_en,
      group_name = EXCLUDED.group_name,
      updated_at = NOW()
  `;
}

export async function upsertPlatformLabelsBulk(
  items: { key: string; valueAr: string; valueEn: string; groupName?: string }[],
): Promise<void> {
  await ensureLmsSpecSchema();
  for (const item of items) {
    await upsertPlatformLabel(item.key, item.valueAr, item.valueEn, item.groupName ?? "general");
  }
}

// ============================================================
// Category — أقسام فرعية + إظهار/تثبيت
// ============================================================
export async function updateCategoryFields(
  id: string,
  data: { parentId?: string | null; isVisible?: boolean; isPinned?: boolean; pinOrder?: number | null },
): Promise<void> {
  await ensureLmsSpecSchema();
  if (data.parentId !== undefined) {
    await sql`UPDATE "Category" SET parent_id = ${data.parentId}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.isVisible !== undefined) {
    await sql`UPDATE "Category" SET is_visible = ${data.isVisible}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.isPinned !== undefined) {
    await sql`UPDATE "Category" SET is_pinned = ${data.isPinned}, updated_at = NOW() WHERE id = ${id}`;
  }
  if (data.pinOrder !== undefined) {
    await sql`UPDATE "Category" SET pin_order = ${data.pinOrder}, updated_at = NOW() WHERE id = ${id}`;
  }
}

export async function getVisibleCategories(): Promise<Category[]> {
  await ensureLmsSpecSchema();
  const rows = await sql`SELECT * FROM "Category" WHERE is_visible = true ORDER BY "order" ASC`;
  return rowsToCamel<Category>(rows as Record<string, unknown>[]);
}

export async function getPinnedCategories(): Promise<Category[]> {
  await ensureLmsSpecSchema();
  const rows = await sql`
    SELECT * FROM "Category"
    WHERE is_pinned = true AND is_visible = true
    ORDER BY pin_order ASC NULLS LAST, "order" ASC
  `;
  return rowsToCamel<Category>(rows as Record<string, unknown>[]);
}

// ============================================================
// Course — حقول الوصول
// ============================================================
export type CourseAccessFields = {
  accessType: CourseAccessType | string;
  accessDurationDays: number | null;
  isVisible: boolean;
  deliveryMode: string;
};

export async function getCourseAccessFields(courseId: string): Promise<CourseAccessFields | null> {
  await ensureLmsSpecSchema();
  const rows = await sql`
    SELECT access_type, access_duration_days, is_visible, delivery_mode
    FROM "Course" WHERE id = ${courseId} LIMIT 1
  `;
  const r = rows[0] as Record<string, unknown> | undefined;
  if (!r) return null;
  return {
    accessType: String(r.access_type ?? "lifetime") as CourseAccessType,
    accessDurationDays: r.access_duration_days == null ? null : Number(r.access_duration_days),
    isVisible: r.is_visible !== false,
    deliveryMode: String(r.delivery_mode ?? "recorded"),
  };
}

export async function updateCourseAccessFields(
  courseId: string,
  data: { accessType?: CourseAccessType; accessDurationDays?: number | null; isVisible?: boolean; deliveryMode?: string },
): Promise<void> {
  await ensureLmsSpecSchema();
  if (data.accessType !== undefined) {
    await sql`UPDATE "Course" SET access_type = ${data.accessType}, updated_at = NOW() WHERE id = ${courseId}`;
  }
  if (data.accessDurationDays !== undefined) {
    await sql`UPDATE "Course" SET access_duration_days = ${data.accessDurationDays}, updated_at = NOW() WHERE id = ${courseId}`;
  }
  if (data.isVisible !== undefined) {
    await sql`UPDATE "Course" SET is_visible = ${data.isVisible}, updated_at = NOW() WHERE id = ${courseId}`;
  }
  if (data.deliveryMode !== undefined) {
    await sql`UPDATE "Course" SET delivery_mode = ${data.deliveryMode}, updated_at = NOW() WHERE id = ${courseId}`;
  }
}

// ============================================================
// Quiz — الحد الأدنى للنجاح (لإصدار الشهادات تلقائياً)
// ============================================================
export async function updateQuizPassingScore(quizId: string, passingScore: number | null): Promise<void> {
  await ensureLmsSpecSchema();
  await sql`UPDATE "Quiz" SET passing_score = ${passingScore} WHERE id = ${quizId}`;
}

// ============================================================
// Enrollment — تفعيل الوصول وانتهاؤه
// ============================================================
export type EnrollmentWithAccess = {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  activatedAt: Date | null;
  expiresAt: Date | null;
};

/** إنشاء/تحديث تسجيل مع تحديد صلاحية الوصول حسب نوع الكورس */
export async function createEnrollmentWithAccess(
  userId: string,
  courseId: string,
  accessType: CourseAccessType | string,
  durationDays?: number | null,
): Promise<EnrollmentWithAccess> {
  await ensureLmsSpecSchema();
  const id = generateId();

  let expiresAt: Date | null = null;
  if (accessType === "duration_days") {
    const days = Math.max(1, Number(durationDays) || 30);
    expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  // lifetime / subscription_only => expiresAt = null (subscription_only يُفرض عبر اشتراك المنصة)

  await sql`
    INSERT INTO "Enrollment" (id, user_id, course_id, activated_at, expires_at)
    VALUES (${id}, ${userId}, ${courseId}, NOW(), ${expiresAt})
    ON CONFLICT (user_id, course_id) DO UPDATE SET
      activated_at = NOW(),
      expires_at = EXCLUDED.expires_at
  `;

  const rows = await sql`SELECT * FROM "Enrollment" WHERE user_id = ${userId} AND course_id = ${courseId} LIMIT 1`;
  const row = rowToCamel<EnrollmentWithAccess>(rows[0] as Record<string, unknown>);
  if (!row) throw new Error("فشل إنشاء التسجيل");
  return row;
}

/** هل التسجيل نشط الآن؟ (بدون انتهاء أو لم تنتهِ صلاحيته بعد) */
export function isEnrollmentActive(enrollment: { expiresAt?: Date | string | null } | null | undefined): boolean {
  if (!enrollment) return false;
  if (!enrollment.expiresAt) return true;
  const exp = enrollment.expiresAt instanceof Date ? enrollment.expiresAt : new Date(enrollment.expiresAt);
  return exp.getTime() > Date.now();
}

/**
 * فحص وصول كامل ومستقل عن lib/db.ts (نسخة مكرَّرة من فحص اشتراك المنصة لتجنّب حلقة استيراد):
 * تسجيل نشط (بدون انتهاء صلاحية) OR اشتراك منصّة نشط على كورس مدفوع منشور.
 */
export async function userHasValidCourseAccess(userId: string, courseId: string): Promise<boolean> {
  await ensureLmsSpecSchema();

  const courseRows = await sql`
    SELECT is_published, price, access_type FROM "Course" WHERE id = ${courseId} LIMIT 1
  `;
  const course = courseRows[0] as {
    is_published?: boolean;
    price?: unknown;
    access_type?: string;
  } | undefined;
  if (!course?.is_published) return false;
  const accessType = String(course.access_type ?? "lifetime");
  const price = Number(course.price) || 0;

  const hasActiveSub = async () => {
    try {
      const subRows = await sql`
        SELECT 1 FROM "UserPlatformSubscription"
        WHERE user_id = ${userId} AND expires_at > NOW()
        LIMIT 1
      `;
      return (subRows as unknown[]).length > 0;
    } catch {
      return false;
    }
  };

  if (accessType === "subscription_only") {
    return hasActiveSub();
  }

  const enrollmentRows = await sql`
    SELECT * FROM "Enrollment" WHERE user_id = ${userId} AND course_id = ${courseId} LIMIT 1
  `;
  const enrollment = rowToCamel<EnrollmentWithAccess>(enrollmentRows[0] as Record<string, unknown>);
  if (enrollment && isEnrollmentActive(enrollment)) return true;

  // اشتراك المنصة يفتح الكورسات المدفوعة المستقلة أيضاً
  if (price > 0 && (await hasActiveSub())) return true;
  return false;
}

// ============================================================
// وسائل الدفع (PaymentMethod) CRUD
// ============================================================
export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  await ensureLmsSpecSchema();
  const rows = await sql`SELECT * FROM "PaymentMethod" ORDER BY "order" ASC, created_at ASC`;
  return rowsToCamel<PaymentMethod>(rows as Record<string, unknown>[]);
}

export async function listEnabledPaymentMethods(): Promise<PaymentMethod[]> {
  await ensureLmsSpecSchema();
  const rows = await sql`SELECT * FROM "PaymentMethod" WHERE is_enabled = true ORDER BY "order" ASC`;
  return rowsToCamel<PaymentMethod>(rows as Record<string, unknown>[]);
}

const DEFAULT_PAYMENT_METHODS: {
  id: string;
  type: string;
  name: string;
  nameAr: string;
  accountDetails: string | null;
  instructions: string;
  instructionsEn: string;
  isEnabled: boolean;
  order: number;
}[] = [
  {
    id: "pm_vodafone_cash",
    type: "vodafone_cash",
    name: "Vodafone Cash",
    nameAr: "فودافون كاش",
    accountDetails: "01023005622",
    instructions: "قم بتحويل المبلغ المطلوب إلى رقم محفظة فودافون كاش التالي، ثم أرسل صورة تأكيد التحويل على واتساب.",
    instructionsEn: "Transfer the required amount to the Vodafone Cash wallet below, then send a confirmation screenshot on WhatsApp.",
    isEnabled: true,
    order: 0,
  },
  {
    id: "pm_orange_cash",
    type: "orange_cash",
    name: "Orange Cash",
    nameAr: "أورنج كاش",
    accountDetails: null,
    instructions: "قم بتحويل المبلغ المطلوب إلى رقم محفظة أورنج كاش التالي، ثم أرسل صورة تأكيد التحويل على واتساب.",
    instructionsEn: "Transfer the required amount to the Orange Cash wallet below, then send a confirmation screenshot on WhatsApp.",
    isEnabled: true,
    order: 1,
  },
  {
    id: "pm_etisalat_cash",
    type: "etisalat_cash",
    name: "Etisalat Cash",
    nameAr: "اتصالات كاش",
    accountDetails: null,
    instructions: "قم بتحويل المبلغ المطلوب إلى رقم محفظة اتصالات كاش التالي، ثم أرسل صورة تأكيد التحويل على واتساب.",
    instructionsEn: "Transfer the required amount to the Etisalat Cash wallet below, then send a confirmation screenshot on WhatsApp.",
    isEnabled: true,
    order: 2,
  },
  {
    id: "pm_instapay",
    type: "instapay",
    name: "InstaPay",
    nameAr: "إنستاباي",
    accountDetails: null,
    instructions: "حوّل المبلغ عبر إنستاباي إلى الحساب التالي، ثم أرسل صورة تأكيد التحويل على واتساب.",
    instructionsEn: "Transfer the amount via InstaPay to the account below, then send a confirmation screenshot on WhatsApp.",
    isEnabled: true,
    order: 3,
  },
  {
    id: "pm_paypal",
    type: "paypal",
    name: "PayPal",
    nameAr: "باي بال",
    accountDetails: null,
    instructions: "أرسل المبلغ إلى حساب PayPal التالي (بريد إلكتروني أو رابط)، ثم أرسل صورة/إيصال التأكيد على واتساب.",
    instructionsEn: "Send the amount to the PayPal account below (email or link), then send a confirmation receipt on WhatsApp.",
    isEnabled: true,
    order: 4,
  },
  {
    id: "pm_fawaterak",
    type: "fawaterak",
    name: "Fawaterak",
    nameAr: "فاتورتك",
    accountDetails: null,
    instructions: "ادفع مباشرة عبر بوابة فاتورتك (عند التفعيل).",
    instructionsEn: "Pay directly through the Fawaterak gateway (when enabled).",
    isEnabled: false,
    order: 5,
  },
];

/** يضيف وسائل الدفع المطلوبة إن لم تكن موجودة (حتى لو الجدول غير فارغ) */
async function ensureRequiredPaymentMethods(): Promise<void> {
  for (const m of DEFAULT_PAYMENT_METHODS) {
    await sql`
      INSERT INTO "PaymentMethod" (id, type, name, name_ar, account_details, instructions, instructions_en, is_enabled, "order")
      VALUES (${m.id}, ${m.type}, ${m.name}, ${m.nameAr}, ${m.accountDetails}, ${m.instructions}, ${m.instructionsEn}, ${m.isEnabled}, ${m.order})
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function seedDefaultPaymentMethodsIfEmpty(): Promise<void> {
  await ensureRequiredPaymentMethods();
}

export async function createPaymentMethod(data: {
  type: string;
  name: string;
  nameAr?: string | null;
  accountDetails?: string | null;
  instructions?: string | null;
  instructionsEn?: string | null;
  configJson?: string | null;
  isEnabled?: boolean;
  order?: number;
}): Promise<{ id: string }> {
  await ensureLmsSpecSchema();
  const id = generateId();
  await sql`
    INSERT INTO "PaymentMethod" (id, type, name, name_ar, account_details, instructions, instructions_en, config_json, is_enabled, "order")
    VALUES (
      ${id}, ${data.type.trim()}, ${data.name.trim()}, ${data.nameAr ?? null},
      ${data.accountDetails ?? null}, ${data.instructions ?? null}, ${data.instructionsEn ?? null},
      ${data.configJson ?? null}, ${data.isEnabled !== false}, ${data.order ?? 0}
    )
  `;
  return { id };
}

export async function updatePaymentMethod(
  id: string,
  data: Partial<{
    type: string;
    name: string;
    nameAr: string | null;
    accountDetails: string | null;
    instructions: string | null;
    instructionsEn: string | null;
    configJson: string | null;
    isEnabled: boolean;
    order: number;
  }>,
): Promise<void> {
  await ensureLmsSpecSchema();
  if (data.type !== undefined) await sql`UPDATE "PaymentMethod" SET type = ${data.type}, updated_at = NOW() WHERE id = ${id}`;
  if (data.name !== undefined) await sql`UPDATE "PaymentMethod" SET name = ${data.name}, updated_at = NOW() WHERE id = ${id}`;
  if (data.nameAr !== undefined) await sql`UPDATE "PaymentMethod" SET name_ar = ${data.nameAr}, updated_at = NOW() WHERE id = ${id}`;
  if (data.accountDetails !== undefined)
    await sql`UPDATE "PaymentMethod" SET account_details = ${data.accountDetails}, updated_at = NOW() WHERE id = ${id}`;
  if (data.instructions !== undefined)
    await sql`UPDATE "PaymentMethod" SET instructions = ${data.instructions}, updated_at = NOW() WHERE id = ${id}`;
  if (data.instructionsEn !== undefined)
    await sql`UPDATE "PaymentMethod" SET instructions_en = ${data.instructionsEn}, updated_at = NOW() WHERE id = ${id}`;
  if (data.configJson !== undefined)
    await sql`UPDATE "PaymentMethod" SET config_json = ${data.configJson}, updated_at = NOW() WHERE id = ${id}`;
  if (data.isEnabled !== undefined)
    await sql`UPDATE "PaymentMethod" SET is_enabled = ${data.isEnabled}, updated_at = NOW() WHERE id = ${id}`;
  if (data.order !== undefined) await sql`UPDATE "PaymentMethod" SET "order" = ${data.order}, updated_at = NOW() WHERE id = ${id}`;
}

export async function deletePaymentMethod(id: string): Promise<void> {
  await ensureLmsSpecSchema();
  await sql`DELETE FROM "PaymentMethod" WHERE id = ${id}`;
}

// ============================================================
// الإشعارات (Notification) CRUD
// ============================================================
export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
}): Promise<{ id: string }> {
  await ensureLmsSpecSchema();
  const id = generateId();
  await sql`
    INSERT INTO "Notification" (id, user_id, type, title, body, link)
    VALUES (${id}, ${data.userId}, ${data.type}, ${data.title}, ${data.body ?? null}, ${data.link ?? null})
  `;
  return { id };
}

export async function getNotificationsForUser(userId: string, limit = 50): Promise<Notification[]> {
  await ensureLmsSpecSchema();
  const rows = await sql`
    SELECT * FROM "Notification" WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit}
  `;
  return rowsToCamel<Notification>(rows as Record<string, unknown>[]);
}

export async function markNotificationRead(id: string): Promise<void> {
  await ensureLmsSpecSchema();
  await sql`UPDATE "Notification" SET read_at = NOW() WHERE id = ${id} AND read_at IS NULL`;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await ensureLmsSpecSchema();
  await sql`UPDATE "Notification" SET read_at = NOW() WHERE user_id = ${userId} AND read_at IS NULL`;
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  await ensureLmsSpecSchema();
  const rows = await sql`
    SELECT COUNT(*)::int AS c FROM "Notification" WHERE user_id = ${userId} AND read_at IS NULL
  `;
  return Number((rows[0] as { c?: number } | undefined)?.c ?? 0);
}

// ============================================================
// الشهادات (Certificate)
// ============================================================
function generateCertificatePublicId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 12; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `CERT-${s}`;
}

export async function createCertificate(data: {
  userId: string;
  courseId: string;
  quizId?: string | null;
  attemptId?: string | null;
  studentName: string;
  courseTitle: string;
  score?: number | null;
}): Promise<Certificate> {
  await ensureLmsSpecSchema();
  const id = generateId();
  const certificateId = generateCertificatePublicId();
  await sql`
    INSERT INTO "Certificate" (id, certificate_id, user_id, course_id, quiz_id, attempt_id, student_name, course_title, score)
    VALUES (
      ${id}, ${certificateId}, ${data.userId}, ${data.courseId}, ${data.quizId ?? null},
      ${data.attemptId ?? null}, ${data.studentName}, ${data.courseTitle}, ${data.score ?? null}
    )
  `;
  const rows = await sql`SELECT * FROM "Certificate" WHERE id = ${id} LIMIT 1`;
  const cert = rowToCamel<Certificate>(rows[0] as Record<string, unknown>);
  if (!cert) throw new Error("فشل إصدار الشهادة");
  return cert;
}

export async function getCertificateByPublicId(certificateId: string): Promise<Certificate | null> {
  await ensureLmsSpecSchema();
  const rows = await sql`SELECT * FROM "Certificate" WHERE certificate_id = ${certificateId.trim()} LIMIT 1`;
  return rowToCamel<Certificate>(rows[0] as Record<string, unknown>);
}

/** جلب شهادة بمعرّفها الداخلي (لعرضها/طباعتها لصاحبها أو للإدارة) */
export async function getCertificateById(id: string): Promise<Certificate | null> {
  await ensureLmsSpecSchema();
  const rows = await sql`SELECT * FROM "Certificate" WHERE id = ${id.trim()} LIMIT 1`;
  return rowToCamel<Certificate>(rows[0] as Record<string, unknown>);
}

export async function getCertificatesForUser(userId: string): Promise<Certificate[]> {
  await ensureLmsSpecSchema();
  const rows = await sql`SELECT * FROM "Certificate" WHERE user_id = ${userId} ORDER BY issued_at DESC`;
  return rowsToCamel<Certificate>(rows as Record<string, unknown>[]);
}

export async function listCertificatesForAdmin(limit = 50): Promise<Certificate[]> {
  await ensureLmsSpecSchema();
  const safeLimit = Math.min(200, Math.max(1, Math.floor(limit)));
  const rows = await sql`
    SELECT * FROM "Certificate" ORDER BY issued_at DESC LIMIT ${safeLimit}
  `;
  return rowsToCamel<Certificate>(rows as Record<string, unknown>[]);
}

export async function deleteCertificateById(id: string): Promise<boolean> {
  await ensureLmsSpecSchema();
  const result = await sql`DELETE FROM "Certificate" WHERE id = ${id.trim()} RETURNING id`;
  return (result as { id: string }[]).length > 0;
}

// ============================================================
// تصميم الشهادات (CertificateDesignSetting)
// ============================================================
export type CertificateDesignSettings = {
  primaryColor: string;
  accentColor: string;
  goldColor: string;
  titleAr: string | null;
  titleEn: string | null;
  eyebrowAr: string | null;
  eyebrowEn: string | null;
  logoUrl: string | null;
  signatureUrl: string | null;
  signatureLabelAr: string | null;
  signatureLabelEn: string | null;
  showScore: boolean;
  showPattern: boolean;
  borderWidth: number;
};

export const DEFAULT_CERTIFICATE_DESIGN: CertificateDesignSettings = {
  primaryColor: "#0F172A",
  accentColor: "#2563EB",
  goldColor: "#F59E0B",
  titleAr: null,
  titleEn: null,
  eyebrowAr: null,
  eyebrowEn: null,
  logoUrl: null,
  signatureUrl: null,
  signatureLabelAr: null,
  signatureLabelEn: null,
  showScore: true,
  showPattern: true,
  borderWidth: 6,
};

function parseCertificateDesignRow(r: Record<string, unknown> | undefined): CertificateDesignSettings {
  const borderRaw = r?.border_width != null ? Number(r.border_width) : DEFAULT_CERTIFICATE_DESIGN.borderWidth;
  return {
    primaryColor: String(r?.primary_color || DEFAULT_CERTIFICATE_DESIGN.primaryColor),
    accentColor: String(r?.accent_color || DEFAULT_CERTIFICATE_DESIGN.accentColor),
    goldColor: String(r?.gold_color || DEFAULT_CERTIFICATE_DESIGN.goldColor),
    titleAr: (r?.title_ar as string | null) ?? null,
    titleEn: (r?.title_en as string | null) ?? null,
    eyebrowAr: (r?.eyebrow_ar as string | null) ?? null,
    eyebrowEn: (r?.eyebrow_en as string | null) ?? null,
    logoUrl: (r?.logo_url as string | null) ?? null,
    signatureUrl: (r?.signature_url as string | null) ?? null,
    signatureLabelAr: (r?.signature_label_ar as string | null) ?? null,
    signatureLabelEn: (r?.signature_label_en as string | null) ?? null,
    showScore: r?.show_score === false || r?.show_score === "false" ? false : true,
    showPattern: r?.show_pattern === false || r?.show_pattern === "false" ? false : true,
    borderWidth: Number.isFinite(borderRaw) ? Math.min(16, Math.max(2, Math.round(borderRaw))) : 6,
  };
}

export async function getCertificateDesignSettings(): Promise<CertificateDesignSettings> {
  await ensureLmsSpecSchema();
  try {
    const rows = await sql`SELECT * FROM "CertificateDesignSetting" WHERE id = 'default' LIMIT 1`;
    return parseCertificateDesignRow(rows[0] as Record<string, unknown> | undefined);
  } catch {
    return { ...DEFAULT_CERTIFICATE_DESIGN };
  }
}

export async function updateCertificateDesignSettings(
  data: Partial<CertificateDesignSettings>,
): Promise<CertificateDesignSettings> {
  await ensureLmsSpecSchema();
  await sql`
    INSERT INTO "CertificateDesignSetting" (id)
    VALUES ('default')
    ON CONFLICT (id) DO NOTHING
  `;

  if (data.primaryColor !== undefined)
    await sql`UPDATE "CertificateDesignSetting" SET primary_color = ${data.primaryColor}, updated_at = NOW() WHERE id = 'default'`;
  if (data.accentColor !== undefined)
    await sql`UPDATE "CertificateDesignSetting" SET accent_color = ${data.accentColor}, updated_at = NOW() WHERE id = 'default'`;
  if (data.goldColor !== undefined)
    await sql`UPDATE "CertificateDesignSetting" SET gold_color = ${data.goldColor}, updated_at = NOW() WHERE id = 'default'`;
  if (data.titleAr !== undefined)
    await sql`UPDATE "CertificateDesignSetting" SET title_ar = ${data.titleAr}, updated_at = NOW() WHERE id = 'default'`;
  if (data.titleEn !== undefined)
    await sql`UPDATE "CertificateDesignSetting" SET title_en = ${data.titleEn}, updated_at = NOW() WHERE id = 'default'`;
  if (data.eyebrowAr !== undefined)
    await sql`UPDATE "CertificateDesignSetting" SET eyebrow_ar = ${data.eyebrowAr}, updated_at = NOW() WHERE id = 'default'`;
  if (data.eyebrowEn !== undefined)
    await sql`UPDATE "CertificateDesignSetting" SET eyebrow_en = ${data.eyebrowEn}, updated_at = NOW() WHERE id = 'default'`;
  if (data.logoUrl !== undefined)
    await sql`UPDATE "CertificateDesignSetting" SET logo_url = ${data.logoUrl}, updated_at = NOW() WHERE id = 'default'`;
  if (data.signatureUrl !== undefined)
    await sql`UPDATE "CertificateDesignSetting" SET signature_url = ${data.signatureUrl}, updated_at = NOW() WHERE id = 'default'`;
  if (data.signatureLabelAr !== undefined)
    await sql`UPDATE "CertificateDesignSetting" SET signature_label_ar = ${data.signatureLabelAr}, updated_at = NOW() WHERE id = 'default'`;
  if (data.signatureLabelEn !== undefined)
    await sql`UPDATE "CertificateDesignSetting" SET signature_label_en = ${data.signatureLabelEn}, updated_at = NOW() WHERE id = 'default'`;
  if (data.showScore !== undefined)
    await sql`UPDATE "CertificateDesignSetting" SET show_score = ${data.showScore}, updated_at = NOW() WHERE id = 'default'`;
  if (data.showPattern !== undefined)
    await sql`UPDATE "CertificateDesignSetting" SET show_pattern = ${data.showPattern}, updated_at = NOW() WHERE id = 'default'`;
  if (data.borderWidth !== undefined)
    await sql`UPDATE "CertificateDesignSetting" SET border_width = ${data.borderWidth}, updated_at = NOW() WHERE id = 'default'`;

  return getCertificateDesignSettings();
}

/**
 * يصدر شهادة إتمام كورس تلقائياً فقط إذا:
 * 1) نجح المتدرب في الاختبار (النسبة ≥ passing_score المحددة في لوحة التحكم)
 * 2) هذا الاختبار هو آخر اختبار في ترتيب محتوى الكورس (إنهاء الكورس)
 * لا يُصدر شهادة إن لم يُضبط حد النجاح، ولا يكرر شهادة لنفس المستخدم/الكورس.
 */
export async function issueCertificateIfPassed(
  userId: string,
  quizId: string,
  score: number,
  totalQuestions: number,
  attemptId?: string | null,
): Promise<Certificate | null> {
  await ensureLmsSpecSchema();

  const quizRows = await sql`
    SELECT q.id, q.course_id, q.passing_score, q."order" AS quiz_order, c.title AS course_title
    FROM "Quiz" q
    JOIN "Course" c ON c.id = q.course_id
    WHERE q.id = ${quizId}
    LIMIT 1
  `;
  const quiz = quizRows[0] as
    | {
        id?: string;
        course_id?: string;
        passing_score?: number | null;
        quiz_order?: number | null;
        course_title?: string;
      }
    | undefined;
  if (!quiz?.id || !quiz.course_id) return null;

  /* حد النجاح يجب أن يكون مضبوطاً صراحةً في إعدادات الاختبار */
  if (quiz.passing_score == null) return null;
  const passingScore = Number(quiz.passing_score);
  if (!Number.isFinite(passingScore)) return null;

  const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;
  if (percentage < passingScore) return null;

  const courseId = String(quiz.course_id);

  /* آخر اختبار في ترتيب الكورس = إنهاء مسار التقييم / الكورس */
  const lastQuizRows = await sql`
    SELECT id FROM "Quiz"
    WHERE course_id = ${courseId}
    ORDER BY "order" DESC, id ASC
    LIMIT 1
  `;
  const lastQuizId = String((lastQuizRows[0] as { id?: string } | undefined)?.id ?? "");
  if (!lastQuizId || lastQuizId !== quizId) return null;

  const existing = await sql`
    SELECT * FROM "Certificate"
    WHERE user_id = ${userId} AND course_id = ${courseId}
    LIMIT 1
  `;
  if ((existing as unknown[]).length > 0) {
    return rowToCamel<Certificate>(existing[0] as Record<string, unknown>);
  }

  const userRows = await sql`SELECT name FROM "User" WHERE id = ${userId} LIMIT 1`;
  const studentName = String((userRows[0] as { name?: string } | undefined)?.name ?? "");

  return createCertificate({
    userId,
    courseId,
    quizId,
    attemptId: attemptId ?? null,
    studentName,
    courseTitle: String(quiz.course_title ?? ""),
    score: Math.round(percentage),
  });
}

// ============================================================
// أقسام الصفحة الرئيسية (HomepageSection) CRUD
// ============================================================
const DEFAULT_HOMEPAGE_SECTIONS: {
  id: string;
  sectionType: string;
  title: string;
  titleEn: string;
  icon: string;
  order: number;
}[] = [
  { id: "hs_courses", sectionType: "courses", title: "الكورسات", titleEn: "Courses", icon: "book", order: 0 },
  { id: "hs_library", sectionType: "library", title: "المكتبة", titleEn: "Library", icon: "library", order: 1 },
  { id: "hs_jobs", sectionType: "jobs", title: "الوظائف", titleEn: "Jobs", icon: "briefcase", order: 2 },
  { id: "hs_teachers", sectionType: "teachers", title: "اختر مدرسك", titleEn: "Choose a Teacher", icon: "users", order: 3 },
  { id: "hs_live", sectionType: "live", title: "البث المباشر", titleEn: "Live", icon: "video", order: 4 },
  { id: "hs_subscriptions", sectionType: "subscriptions", title: "الاشتراكات", titleEn: "Subscriptions", icon: "star", order: 5 },
  { id: "hs_reviews", sectionType: "reviews", title: "آراء الطلاب", titleEn: "Reviews", icon: "chat", order: 6 },
  { id: "hs_news", sectionType: "news", title: "أخبار المنصة", titleEn: "News", icon: "newspaper", order: 7 },
  { id: "hs_platform_details", sectionType: "platform_details", title: "تفاصيل المنصة", titleEn: "Platform Details", icon: "info", order: 8 },
  { id: "hs_social", sectionType: "social", title: "تابعنا", titleEn: "Follow Us", icon: "share", order: 9 },
];

async function seedDefaultHomepageSectionsIfEmpty(): Promise<void> {
  const existing = await sql`SELECT 1 FROM "HomepageSection" LIMIT 1`;
  if ((existing as unknown[]).length > 0) return;
  for (const s of DEFAULT_HOMEPAGE_SECTIONS) {
    await sql`
      INSERT INTO "HomepageSection" (id, section_type, title, title_en, icon, "order")
      VALUES (${s.id}, ${s.sectionType}, ${s.title}, ${s.titleEn}, ${s.icon}, ${s.order})
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  await ensureLmsSpecSchema();
  const rows = await sql`SELECT * FROM "HomepageSection" ORDER BY is_pinned DESC, "order" ASC`;
  return rowsToCamel<HomepageSection>(rows as Record<string, unknown>[]);
}

export async function getVisibleHomepageSections(): Promise<HomepageSection[]> {
  await ensureLmsSpecSchema();
  const rows = await sql`
    SELECT * FROM "HomepageSection" WHERE is_visible = true ORDER BY is_pinned DESC, "order" ASC
  `;
  return rowsToCamel<HomepageSection>(rows as Record<string, unknown>[]);
}

export async function upsertHomepageSection(data: {
  id?: string;
  sectionType: string;
  title?: string | null;
  titleEn?: string | null;
  icon?: string | null;
  configJson?: string | null;
  order?: number;
  isVisible?: boolean;
  isPinned?: boolean;
}): Promise<{ id: string }> {
  await ensureLmsSpecSchema();
  const id = data.id ?? generateId();
  await sql`
    INSERT INTO "HomepageSection" (id, section_type, title, title_en, icon, config_json, "order", is_visible, is_pinned)
    VALUES (
      ${id}, ${data.sectionType}, ${data.title ?? null}, ${data.titleEn ?? null}, ${data.icon ?? null},
      ${data.configJson ?? null}, ${data.order ?? 0}, ${data.isVisible !== false}, ${data.isPinned === true}
    )
    ON CONFLICT (id) DO UPDATE SET
      section_type = EXCLUDED.section_type,
      title = EXCLUDED.title,
      title_en = EXCLUDED.title_en,
      icon = EXCLUDED.icon,
      config_json = EXCLUDED.config_json,
      "order" = EXCLUDED."order",
      is_visible = EXCLUDED.is_visible,
      is_pinned = EXCLUDED.is_pinned,
      updated_at = NOW()
  `;
  return { id };
}

export async function updateHomepageSectionOrder(ids: string[]): Promise<void> {
  await ensureLmsSpecSchema();
  for (let i = 0; i < ids.length; i++) {
    await sql`UPDATE "HomepageSection" SET "order" = ${i}, updated_at = NOW() WHERE id = ${ids[i]}`;
  }
}

export async function deleteHomepageSection(id: string): Promise<void> {
  await ensureLmsSpecSchema();
  await sql`DELETE FROM "HomepageSection" WHERE id = ${id}`;
}

// ============================================================
// روابط التواصل الاجتماعي (SocialLink) CRUD
// ============================================================
export async function listSocialLinks(): Promise<SocialLink[]> {
  await ensureLmsSpecSchema();
  const rows = await sql`SELECT * FROM "SocialLink" ORDER BY "order" ASC`;
  return rowsToCamel<SocialLink>(rows as Record<string, unknown>[]);
}

export async function listEnabledSocialLinks(): Promise<SocialLink[]> {
  await ensureLmsSpecSchema();
  const rows = await sql`SELECT * FROM "SocialLink" WHERE is_enabled = true ORDER BY "order" ASC`;
  return rowsToCamel<SocialLink>(rows as Record<string, unknown>[]);
}

export async function createSocialLink(data: {
  network: string;
  label?: string | null;
  labelEn?: string | null;
  url: string;
  isEnabled?: boolean;
  order?: number;
}): Promise<{ id: string }> {
  await ensureLmsSpecSchema();
  const id = generateId();
  await sql`
    INSERT INTO "SocialLink" (id, network, label, label_en, url, is_enabled, "order")
    VALUES (${id}, ${data.network}, ${data.label ?? null}, ${data.labelEn ?? null}, ${data.url}, ${data.isEnabled !== false}, ${data.order ?? 0})
  `;
  return { id };
}

export async function updateSocialLink(
  id: string,
  data: Partial<{ network: string; label: string | null; labelEn: string | null; url: string; isEnabled: boolean; order: number }>,
): Promise<void> {
  await ensureLmsSpecSchema();
  if (data.network !== undefined) await sql`UPDATE "SocialLink" SET network = ${data.network} WHERE id = ${id}`;
  if (data.label !== undefined) await sql`UPDATE "SocialLink" SET label = ${data.label} WHERE id = ${id}`;
  if (data.labelEn !== undefined) await sql`UPDATE "SocialLink" SET label_en = ${data.labelEn} WHERE id = ${id}`;
  if (data.url !== undefined) await sql`UPDATE "SocialLink" SET url = ${data.url} WHERE id = ${id}`;
  if (data.isEnabled !== undefined) await sql`UPDATE "SocialLink" SET is_enabled = ${data.isEnabled} WHERE id = ${id}`;
  if (data.order !== undefined) await sql`UPDATE "SocialLink" SET "order" = ${data.order} WHERE id = ${id}`;
}

export async function deleteSocialLink(id: string): Promise<void> {
  await ensureLmsSpecSchema();
  await sql`DELETE FROM "SocialLink" WHERE id = ${id}`;
}

// ============================================================
// LiveStream — الحقول الإضافية (قسم/مدة/ظهور بالرئيسية/وصول/تسجيل)
// ============================================================
export async function updateLiveStreamSpecFields(
  id: string,
  data: {
    courseId?: string | null;
    categoryId?: string | null;
    durationMinutes?: number | null;
    showOnHomepage?: boolean;
    accessMode?: LiveStreamAccessMode | string;
    recordingUrl?: string | null;
    provider?: LiveStreamProvider | string;
  },
): Promise<void> {
  await ensureLmsSpecSchema();
  if (data.courseId !== undefined) await sql`UPDATE "LiveStream" SET course_id = ${data.courseId}, updated_at = NOW() WHERE id = ${id}`;
  if (data.categoryId !== undefined) await sql`UPDATE "LiveStream" SET category_id = ${data.categoryId}, updated_at = NOW() WHERE id = ${id}`;
  if (data.durationMinutes !== undefined)
    await sql`UPDATE "LiveStream" SET duration_minutes = ${data.durationMinutes}, updated_at = NOW() WHERE id = ${id}`;
  if (data.showOnHomepage !== undefined)
    await sql`UPDATE "LiveStream" SET show_on_homepage = ${data.showOnHomepage}, updated_at = NOW() WHERE id = ${id}`;
  if (data.accessMode !== undefined) await sql`UPDATE "LiveStream" SET access_mode = ${data.accessMode}, updated_at = NOW() WHERE id = ${id}`;
  if (data.recordingUrl !== undefined) await sql`UPDATE "LiveStream" SET recording_url = ${data.recordingUrl}, updated_at = NOW() WHERE id = ${id}`;
  if (data.provider !== undefined) await sql`UPDATE "LiveStream" SET provider = ${data.provider}, updated_at = NOW() WHERE id = ${id}`;
}

export async function getHomepageLiveStreams(): Promise<Record<string, unknown>[]> {
  await ensureLmsSpecSchema();
  const rows = await sql`
    SELECT * FROM "LiveStream" WHERE show_on_homepage = true ORDER BY scheduled_at ASC
  `;
  return rowsToCamel(rows as Record<string, unknown>[]);
}

// ============================================================
// الهوية البصرية + التحليلات (HomepageSetting)
// ============================================================
export type BrandAndAnalyticsSettings = {
  secondaryColor: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  faviconUrl: string | null;
  ga4Id: string | null;
  gtmId: string | null;
  facebookPixelId: string | null;
};

export async function getBrandAndAnalyticsSettings(): Promise<BrandAndAnalyticsSettings> {
  await ensureLmsSpecSchema();
  const rows = await sql`
    SELECT secondary_color, accent_color, background_color, favicon_url, ga4_id, gtm_id, facebook_pixel_id
    FROM "HomepageSetting" WHERE id = 'default' LIMIT 1
  `;
  const r = (rows[0] as Record<string, unknown> | undefined) ?? {};
  return {
    secondaryColor: (r.secondary_color as string | null) ?? null,
    accentColor: (r.accent_color as string | null) ?? null,
    backgroundColor: (r.background_color as string | null) ?? null,
    faviconUrl: (r.favicon_url as string | null) ?? null,
    ga4Id: (r.ga4_id as string | null) ?? null,
    gtmId: (r.gtm_id as string | null) ?? null,
    facebookPixelId: (r.facebook_pixel_id as string | null) ?? null,
  };
}

export async function updateBrandSettings(data: Partial<BrandAndAnalyticsSettings>): Promise<void> {
  await ensureLmsSpecSchema();
  await sql`
    INSERT INTO "HomepageSetting" (id, updated_at)
    VALUES ('default', NOW())
    ON CONFLICT (id) DO NOTHING
  `;
  if (data.secondaryColor !== undefined)
    await sql`UPDATE "HomepageSetting" SET secondary_color = ${data.secondaryColor}, updated_at = NOW() WHERE id = 'default'`;
  if (data.accentColor !== undefined)
    await sql`UPDATE "HomepageSetting" SET accent_color = ${data.accentColor}, updated_at = NOW() WHERE id = 'default'`;
  if (data.backgroundColor !== undefined)
    await sql`UPDATE "HomepageSetting" SET background_color = ${data.backgroundColor}, updated_at = NOW() WHERE id = 'default'`;
  if (data.faviconUrl !== undefined)
    await sql`UPDATE "HomepageSetting" SET favicon_url = ${data.faviconUrl}, updated_at = NOW() WHERE id = 'default'`;
  if (data.ga4Id !== undefined) await sql`UPDATE "HomepageSetting" SET ga4_id = ${data.ga4Id}, updated_at = NOW() WHERE id = 'default'`;
  if (data.gtmId !== undefined) await sql`UPDATE "HomepageSetting" SET gtm_id = ${data.gtmId}, updated_at = NOW() WHERE id = 'default'`;
  if (data.facebookPixelId !== undefined)
    await sql`UPDATE "HomepageSetting" SET facebook_pixel_id = ${data.facebookPixelId}, updated_at = NOW() WHERE id = 'default'`;
}

// ============================================================
// SubscriptionPlan — مدة عامة بالقيمة
// ============================================================
/** يحسب تاريخ الانتهاء بإضافة (value × kind) لتاريخ البداية — يدعم باقات مثل "3 أشهر" */
export function computeExpiresAt(from: Date, kind: SubscriptionDurationKind, value = 1): Date {
  const d = new Date(from.getTime());
  const n = Math.max(1, Math.floor(value) || 1);
  if (kind === "week") d.setUTCDate(d.getUTCDate() + 7 * n);
  else if (kind === "month") d.setUTCDate(d.getUTCDate() + 30 * n);
  else d.setUTCDate(d.getUTCDate() + 365 * n);
  return d;
}
