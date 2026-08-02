-- جدول أكواد التفعيل المجانية للدورات
-- تشغيله مرة واحدة من لوحة Neon: SQL Editor

CREATE TABLE IF NOT EXISTS "ActivationCode" (
  id               TEXT PRIMARY KEY,
  course_id        TEXT NOT NULL REFERENCES "Course"(id) ON DELETE CASCADE,
  code             TEXT NOT NULL UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at          TIMESTAMPTZ,
  used_by_user_id  TEXT REFERENCES "User"(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "ActivationCode_course_id_idx" ON "ActivationCode"(course_id);
CREATE INDEX IF NOT EXISTS "ActivationCode_code_idx" ON "ActivationCode"(code);
CREATE INDEX IF NOT EXISTS "ActivationCode_created_at_idx" ON "ActivationCode"(created_at);

-- ربط كود التفعيل بحصص محددة داخل الكورس (اختياري)
-- إذا كان للكود صفوف هنا => الكود يفتح الحصص المحددة فقط (بدون تسجيل كامل في الدورة)
CREATE TABLE IF NOT EXISTS "ActivationCodeLesson" (
  activation_code_id TEXT NOT NULL REFERENCES "ActivationCode"(id) ON DELETE CASCADE,
  lesson_id          TEXT NOT NULL REFERENCES "Lesson"(id) ON DELETE CASCADE,
  PRIMARY KEY (activation_code_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS "ActivationCodeLesson_code_idx" ON "ActivationCodeLesson"(activation_code_id);
CREATE INDEX IF NOT EXISTS "ActivationCodeLesson_lesson_idx" ON "ActivationCodeLesson"(lesson_id);

-- ربط كود التفعيل باختبارات محددة داخل الكورس (اختياري)
CREATE TABLE IF NOT EXISTS "ActivationCodeQuiz" (
  activation_code_id TEXT NOT NULL REFERENCES "ActivationCode"(id) ON DELETE CASCADE,
  quiz_id            TEXT NOT NULL REFERENCES "Quiz"(id) ON DELETE CASCADE,
  PRIMARY KEY (activation_code_id, quiz_id)
);

CREATE INDEX IF NOT EXISTS "ActivationCodeQuiz_code_idx" ON "ActivationCodeQuiz"(activation_code_id);
CREATE INDEX IF NOT EXISTS "ActivationCodeQuiz_quiz_idx" ON "ActivationCodeQuiz"(quiz_id);

-- توسيع أكواد التفعيل: اشتراك / صلاحية / استخدام متعدد
ALTER TABLE "ActivationCode" ALTER COLUMN course_id DROP NOT NULL;
ALTER TABLE "ActivationCode" ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'course';
ALTER TABLE "ActivationCode" ADD COLUMN IF NOT EXISTS plan_id TEXT REFERENCES "SubscriptionPlan"(id) ON DELETE SET NULL;
ALTER TABLE "ActivationCode" ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE "ActivationCode" ADD COLUMN IF NOT EXISTS max_uses INT NOT NULL DEFAULT 1;
ALTER TABLE "ActivationCode" ADD COLUMN IF NOT EXISTS used_count INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "ActivationCodeRedemption" (
  id TEXT PRIMARY KEY,
  activation_code_id TEXT NOT NULL REFERENCES "ActivationCode"(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (activation_code_id, user_id)
);
CREATE INDEX IF NOT EXISTS "ActivationCodeRedemption_code_idx" ON "ActivationCodeRedemption"(activation_code_id);
CREATE INDEX IF NOT EXISTS "ActivationCodeRedemption_user_idx" ON "ActivationCodeRedemption"(user_id);