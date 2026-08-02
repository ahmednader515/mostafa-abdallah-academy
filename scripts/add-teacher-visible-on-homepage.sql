-- إظهار / إخفاء المدرب في قسم الرئيسية
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS teacher_visible_on_homepage BOOLEAN NOT NULL DEFAULT true;
