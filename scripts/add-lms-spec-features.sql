-- ============================================================
-- إكمال مواصفات المنصة (LMS Spec) — Phase 1-5
-- نفّذ هذا الملف مرة واحدة من لوحة Neon (SQL Editor) أو عبر:
--   psql $DATABASE_URL -f scripts/add-lms-spec-features.sql
-- كل التعديلات آمنة لإعادة التشغيل (IF NOT EXISTS / ON CONFLICT DO NOTHING).
-- ============================================================

-- ============================================================
-- 1) مسميات المنصة القابلة للتخصيص (PlatformLabel)
--    مثال: "محاضرة" بدل "حصة"، "متدرب" بدل "طالب" ...
-- ============================================================
CREATE TABLE IF NOT EXISTS "PlatformLabel" (
  key         TEXT PRIMARY KEY,
  value_ar    TEXT NOT NULL,
  value_en    TEXT NOT NULL,
  group_name  TEXT NOT NULL DEFAULT 'general',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO "PlatformLabel" (key, value_ar, value_en, group_name) VALUES
  ('lesson',    'محاضرة',      'Lecture',   'content'),
  ('lessons',   'المحاضرات',   'Lectures',  'content'),
  ('student',   'متدرب',       'Trainee',   'users'),
  ('students',  'المتدربون',   'Trainees',  'users'),
  ('course',    'كورس',        'Course',    'content'),
  ('courses',   'الكورسات',    'Courses',   'content'),
  ('material',  'ملزمة',       'Material',  'content'),
  ('materials', 'الملازم',     'Materials', 'content'),
  ('quiz',      'اختبار',      'Quiz',      'content'),
  ('quizzes',   'الاختبارات',  'Quizzes',   'content'),
  ('section',   'قسم',         'Section',   'content'),
  ('sections',  'الأقسام',     'Sections',  'content'),
  ('teacher',   'مدرب',        'Trainer',   'users'),
  ('teachers',  'المدربون',    'Trainers',  'users'),
  ('homework',  'واجب',        'Homework',  'content'),
  ('library',   'المكتبة',     'Library',   'content')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 2) Category: أقسام فرعية + إظهار/تثبيت
-- ============================================================
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS parent_id TEXT REFERENCES "Category"(id) ON DELETE SET NULL;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS pin_order INT;
CREATE INDEX IF NOT EXISTS "Category_parent_id_idx" ON "Category"(parent_id);
CREATE INDEX IF NOT EXISTS "Category_pinned_idx" ON "Category"(is_pinned, pin_order);

-- ============================================================
-- 3) Course: نوع الوصول ومدته + إظهار + طريقة التسليم
-- ============================================================
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS access_type TEXT NOT NULL DEFAULT 'lifetime';
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS access_duration_days INT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS delivery_mode TEXT NOT NULL DEFAULT 'recorded';

DO $$
BEGIN
  ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS course_access_type_chk;
  ALTER TABLE "Course" ADD CONSTRAINT course_access_type_chk
    CHECK (access_type IN ('lifetime', 'duration_days', 'subscription_only'));
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS course_delivery_mode_chk;
  ALTER TABLE "Course" ADD CONSTRAINT course_delivery_mode_chk
    CHECK (delivery_mode IN ('recorded', 'live', 'hybrid'));
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 4) Lesson: إظهار/إخفاء + جدولة نشر
-- ============================================================
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- ============================================================
-- 5) Enrollment: تفعيل + انتهاء الصلاحية
-- ============================================================
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ;
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS "Enrollment_expires_at_idx" ON "Enrollment"(expires_at);

-- ============================================================
-- 6) LiveStream: قسم/مدة/ظهور بالرئيسية/صلاحية الوصول/تسجيل
--    + السماح بأن يكون البث مستقلاً عن كورس (course_id NULLABLE)
--    + توسيع مزودي البث (youtube_live, external)
-- ============================================================
ALTER TABLE "LiveStream" ALTER COLUMN course_id DROP NOT NULL;
ALTER TABLE "LiveStream" ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES "Category"(id) ON DELETE SET NULL;
ALTER TABLE "LiveStream" ADD COLUMN IF NOT EXISTS duration_minutes INT;
ALTER TABLE "LiveStream" ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "LiveStream" ADD COLUMN IF NOT EXISTS access_mode TEXT NOT NULL DEFAULT 'course_enrolled';
ALTER TABLE "LiveStream" ADD COLUMN IF NOT EXISTS recording_url TEXT;
CREATE INDEX IF NOT EXISTS "LiveStream_category_id_idx" ON "LiveStream"(category_id);
CREATE INDEX IF NOT EXISTS "LiveStream_show_on_homepage_idx" ON "LiveStream"(show_on_homepage, scheduled_at);

DO $$
BEGIN
  ALTER TABLE "LiveStream" DROP CONSTRAINT IF EXISTS "LiveStream_provider_check";
EXCEPTION WHEN others THEN NULL;
END $$;
DO $$
BEGIN
  ALTER TABLE "LiveStream" ADD CONSTRAINT livestream_provider_chk
    CHECK (provider IN ('zoom', 'google_meet', 'youtube_live', 'external'));
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "LiveStream" DROP CONSTRAINT IF EXISTS livestream_access_mode_chk;
  ALTER TABLE "LiveStream" ADD CONSTRAINT livestream_access_mode_chk
    CHECK (access_mode IN ('public', 'members', 'paid', 'subscribers', 'course_enrolled'));
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 7) Quiz: الحد الأدنى للنجاح (لإصدار الشهادات تلقائياً)
-- ============================================================
ALTER TABLE "Quiz" ADD COLUMN IF NOT EXISTS passing_score INT;

-- ============================================================
-- 8) وسائل الدفع (PaymentMethod)
-- ============================================================
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
);
CREATE INDEX IF NOT EXISTS "PaymentMethod_enabled_order_idx" ON "PaymentMethod"(is_enabled, "order");

INSERT INTO "PaymentMethod" (id, type, name, name_ar, account_details, instructions, instructions_en, is_enabled, "order")
SELECT * FROM (VALUES
  ('pm_vodafone_cash', 'vodafone_cash', 'Vodafone Cash', 'فودافون كاش', '01023005622',
    'حوّل المبلغ إلى رقم المحفظة ثم أرسل صورة التأكيد.', 'Transfer the amount to the wallet number then send a confirmation screenshot.', true, 0),
  ('pm_instapay', 'instapay', 'InstaPay', 'إنستاباي', NULL,
    'حوّل المبلغ عبر إنستاباي ثم أرسل صورة التأكيد.', 'Transfer the amount via InstaPay then send a confirmation screenshot.', false, 1),
  ('pm_fawaterak', 'fawaterak', 'Fawaterak', 'فاتورتك', NULL,
    'ادفع مباشرة عبر بوابة فاتورتك.', 'Pay directly through the Fawaterak payment gateway.', false, 2)
) AS v(id, type, name, name_ar, account_details, instructions, instructions_en, is_enabled, "order")
WHERE NOT EXISTS (SELECT 1 FROM "PaymentMethod");

-- ============================================================
-- 9) الإشعارات (Notification)
-- ============================================================
CREATE TABLE IF NOT EXISTS "Notification" (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT,
  link       TEXT,
  read_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Notification_user_id_idx" ON "Notification"(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS "Notification_user_unread_idx" ON "Notification"(user_id, read_at);

-- ============================================================
-- 10) الشهادات (Certificate)
-- ============================================================
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
);
CREATE INDEX IF NOT EXISTS "Certificate_user_id_idx" ON "Certificate"(user_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS "Certificate_course_id_idx" ON "Certificate"(course_id);
CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_certificate_id_idx" ON "Certificate"(certificate_id);

-- ============================================================
-- 11) أقسام الصفحة الرئيسية القابلة للتحكم (HomepageSection)
-- ============================================================
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
);
CREATE INDEX IF NOT EXISTS "HomepageSection_order_idx" ON "HomepageSection"("order");

INSERT INTO "HomepageSection" (id, section_type, title, title_en, icon, "order", is_visible, is_pinned)
SELECT * FROM (VALUES
  ('hs_courses',           'courses',           'الكورسات',           'Courses',           'book',        0, true,  false),
  ('hs_library',           'library',           'المكتبة',            'Library',           'library',     1, true,  false),
  ('hs_jobs',              'jobs',              'الوظائف',            'Jobs',              'briefcase',   2, true,  false),
  ('hs_teachers',          'teachers',          'اختر مدرسك',         'Choose a Teacher',  'users',       3, true,  false),
  ('hs_live',              'live',              'البث المباشر',       'Live',              'video',       4, true,  false),
  ('hs_subscriptions',     'subscriptions',     'الاشتراكات',         'Subscriptions',     'star',        5, true,  false),
  ('hs_reviews',           'reviews',           'آراء الطلاب',        'Reviews',           'chat',        6, true,  false),
  ('hs_news',              'news',              'أخبار المنصة',       'News',              'newspaper',   7, true,  false),
  ('hs_platform_details',  'platform_details',  'تفاصيل المنصة',      'Platform Details',  'info',        8, true,  false),
  ('hs_social',            'social',            'تابعنا',             'Follow Us',         'share',       9, true,  false)
) AS v(id, section_type, title, title_en, icon, "order", is_visible, is_pinned)
WHERE NOT EXISTS (SELECT 1 FROM "HomepageSection");

-- ============================================================
-- 12) روابط التواصل الاجتماعي (SocialLink)
-- ============================================================
CREATE TABLE IF NOT EXISTS "SocialLink" (
  id         TEXT PRIMARY KEY,
  network    TEXT NOT NULL,
  label      TEXT,
  label_en   TEXT,
  url        TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  "order"    INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS "SocialLink_order_idx" ON "SocialLink"("order");

-- ============================================================
-- 13) HomepageSetting: هوية بصرية + تحليلات
-- ============================================================
ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS secondary_color TEXT;
ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS accent_color TEXT;
ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS background_color TEXT;
ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS ga4_id TEXT;
ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS gtm_id TEXT;
ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS facebook_pixel_id TEXT;

-- ============================================================
-- 14) SubscriptionPlan: مدة عامة بالقيمة (duration_value * duration_kind)
--     يسمح بباقات مثل "3 أشهر" أو "6 أشهر" دون تعديل duration_kind
-- ============================================================
ALTER TABLE "SubscriptionPlan" ADD COLUMN IF NOT EXISTS duration_value INT NOT NULL DEFAULT 1;

DO $$
BEGIN
  ALTER TABLE "SubscriptionPlan" DROP CONSTRAINT IF EXISTS subscription_plan_duration_chk;
  ALTER TABLE "SubscriptionPlan" ADD CONSTRAINT subscription_plan_duration_chk
    CHECK (duration_kind IN ('week', 'month', 'year'));
EXCEPTION WHEN others THEN NULL;
END $$;
