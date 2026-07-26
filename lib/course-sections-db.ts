import { sql } from "@/lib/db";

function generateId() {
  return `sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export type CourseSection = {
  id: string;
  courseId: string;
  title: string;
  titleAr: string | null;
  sortOrder: number;
};

async function ensureCourseSectionsSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS "CourseSection" (
      id TEXT PRIMARY KEY,
      course_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      title_ar TEXT,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS "CourseSection_course_idx" ON "CourseSection"(course_id, sort_order)`;
  try {
    await sql`ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS section_id TEXT`;
  } catch {
    /* noop */
  }
}

export async function listCourseSections(courseId: string): Promise<CourseSection[]> {
  await ensureCourseSectionsSchema();
  const rows = await sql`
    SELECT * FROM "CourseSection" WHERE course_id = ${courseId} ORDER BY sort_order ASC, created_at ASC
  `;
  return (rows as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    courseId: String(r.course_id),
    title: String(r.title ?? ""),
    titleAr: r.title_ar ? String(r.title_ar) : null,
    sortOrder: Number(r.sort_order ?? 0),
  }));
}

export async function createCourseSection(data: {
  courseId: string;
  title: string;
  titleAr?: string | null;
  sortOrder?: number;
}): Promise<CourseSection> {
  await ensureCourseSectionsSchema();
  const id = generateId();
  const sort = data.sortOrder ?? 0;
  await sql`
    INSERT INTO "CourseSection" (id, course_id, title, title_ar, sort_order)
    VALUES (${id}, ${data.courseId}, ${data.title.trim()}, ${data.titleAr?.trim() || null}, ${sort})
  `;
  const list = await listCourseSections(data.courseId);
  return list.find((s) => s.id === id)!;
}

export async function updateCourseSection(
  id: string,
  data: { title?: string; titleAr?: string | null; sortOrder?: number },
): Promise<void> {
  await ensureCourseSectionsSchema();
  if (data.title !== undefined)
    await sql`UPDATE "CourseSection" SET title = ${data.title.trim()} WHERE id = ${id}`;
  if (data.titleAr !== undefined)
    await sql`UPDATE "CourseSection" SET title_ar = ${data.titleAr?.trim() || null} WHERE id = ${id}`;
  if (data.sortOrder !== undefined)
    await sql`UPDATE "CourseSection" SET sort_order = ${data.sortOrder} WHERE id = ${id}`;
}

export async function deleteCourseSection(id: string): Promise<void> {
  await ensureCourseSectionsSchema();
  try {
    await sql`UPDATE "Lesson" SET section_id = NULL WHERE section_id = ${id}`;
  } catch {
    /* noop */
  }
  await sql`DELETE FROM "CourseSection" WHERE id = ${id}`;
}
