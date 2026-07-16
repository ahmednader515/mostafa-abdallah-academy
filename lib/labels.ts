import { cache } from "react";
import type { Locale } from "@/lib/i18n/types";
import { getPlatformLabelsMap } from "@/lib/lms-spec-db";

/** مفاتيح المسميات الافتراضية (تُستخدم إن لم تُحمَّل من قاعدة البيانات) */
export const DEFAULT_LABELS: Record<string, { ar: string; en: string }> = {
  lesson: { ar: "محاضرة", en: "Lecture" },
  lessons: { ar: "المحاضرات", en: "Lectures" },
  student: { ar: "متدرب", en: "Trainee" },
  students: { ar: "المتدربون", en: "Trainees" },
  course: { ar: "كورس", en: "Course" },
  courses: { ar: "الكورسات", en: "Courses" },
  material: { ar: "ملزمة", en: "Material" },
  materials: { ar: "الملازم", en: "Materials" },
  quiz: { ar: "اختبار", en: "Quiz" },
  quizzes: { ar: "الاختبارات", en: "Quizzes" },
  section: { ar: "قسم", en: "Section" },
  sections: { ar: "الأقسام", en: "Sections" },
  teacher: { ar: "مدرب", en: "Trainer" },
  teachers: { ar: "المدربون", en: "Trainers" },
  homework: { ar: "واجب", en: "Homework" },
  library: { ar: "المكتبة", en: "Library" },
};

const getCachedLabelsMap = cache(async () => {
  try {
    return await getPlatformLabelsMap();
  } catch {
    return {} as Record<string, { ar: string; en: string }>;
  }
});

/** قراءة مسمى ديناميكي من لوحة التحكم مع احتياطي ثابت */
export async function getLabel(key: string, locale: Locale = "ar"): Promise<string> {
  const map = await getCachedLabelsMap();
  const fromDb = map[key];
  if (fromDb) {
    const v = locale === "en" ? fromDb.en : fromDb.ar;
    if (v?.trim()) return v.trim();
  }
  const fallback = DEFAULT_LABELS[key];
  if (fallback) return locale === "en" ? fallback.en : fallback.ar;
  return key;
}

export async function getLabels(
  keys: string[],
  locale: Locale = "ar",
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    keys.map(async (k) => {
      out[k] = await getLabel(k, locale);
    }),
  );
  return out;
}
