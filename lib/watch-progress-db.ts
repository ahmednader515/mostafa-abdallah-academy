import { sql } from "@/lib/db";

async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS "LessonWatchProgress" (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      seconds DOUBLE PRECISION NOT NULL DEFAULT 0,
      percent DOUBLE PRECISION NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, lesson_id)
    )
  `;
}

function generateId(): string {
  return `lwp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function upsertLessonWatchProgress(data: {
  userId: string;
  lessonId: string;
  seconds: number;
  percent: number;
}): Promise<void> {
  await ensureSchema();
  const id = generateId();
  await sql`
    INSERT INTO "LessonWatchProgress" (id, user_id, lesson_id, seconds, percent, updated_at)
    VALUES (${id}, ${data.userId}, ${data.lessonId}, ${data.seconds}, ${data.percent}, NOW())
    ON CONFLICT (user_id, lesson_id) DO UPDATE SET
      seconds = EXCLUDED.seconds,
      percent = EXCLUDED.percent,
      updated_at = NOW()
  `;
}

export async function getLessonWatchProgress(
  userId: string,
  lessonId: string,
): Promise<{ seconds: number; percent: number } | null> {
  await ensureSchema();
  const rows = await sql`
    SELECT seconds, percent FROM "LessonWatchProgress"
    WHERE user_id = ${userId} AND lesson_id = ${lessonId}
    LIMIT 1
  `;
  const r = rows[0] as Record<string, unknown> | undefined;
  if (!r) return null;
  return { seconds: Number(r.seconds ?? 0), percent: Number(r.percent ?? 0) };
}

export async function getCourseWatchPercent(userId: string, lessonIds: string[]): Promise<number> {
  if (lessonIds.length === 0) return 0;
  await ensureSchema();
  const rows = await sql`
    SELECT AVG(percent)::float AS avg_percent
    FROM "LessonWatchProgress"
    WHERE user_id = ${userId} AND lesson_id = ANY(${lessonIds})
  `;
  return Number((rows[0] as { avg_percent?: number })?.avg_percent ?? 0);
}
