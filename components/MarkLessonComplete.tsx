"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/** يسجّل إكمال الحصة عند فتحها، وينقل لصفحة التهنئة إن اكتمل الكورس */
export function MarkLessonComplete({
  courseId,
  lessonId,
  courseSlug,
  enabled,
}: {
  courseId: string;
  lessonId: string;
  courseSlug: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (!enabled || ran.current) return;
    ran.current = true;
    void (async () => {
      try {
        const res = await fetch(
          `/api/courses/${encodeURIComponent(courseId)}/progress/lessons/${encodeURIComponent(lessonId)}`,
          { method: "POST", credentials: "include" },
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.courseCompleted) {
          router.push(`/courses/${encodeURIComponent(courseSlug)}/complete`);
          return;
        }
        if (res.ok) router.refresh();
      } catch {
        /* تجاهل أخطاء الشبكة */
      }
    })();
  }, [enabled, courseId, lessonId, courseSlug, router]);

  return null;
}
