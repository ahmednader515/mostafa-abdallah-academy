import { sql } from "@/lib/db";

export type DashboardOverview = {
  students: number;
  teachers: number;
  courses: number;
  activeSubscribers: number;
  salesCount: number;
  salesRevenue: number;
  libraryFiles: number;
  jobs: number;
  unreadMessages: number;
  activeUsers: number;
  avgTraineeProgress: number;
  courseCompletionRate: number;
  registrationsByMonth: { label: string; count: number }[];
  salesByMonth: { label: string; amount: number }[];
  newSubscriptionsByMonth: { label: string; count: number }[];
};

export async function ensureUserExtraColumns() {
  try {
    await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false`;
    await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ`;
    await sql`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS teacher_bio TEXT`;
  } catch {
    /* noop */
  }
}

function num(rows: unknown, key: string): number {
  return Number(((rows as Record<string, unknown>[])?.[0] ?? {})[key] ?? 0);
}

function padLastMonths<T extends { label: string }>(
  rows: T[],
  empty: (label: string) => T,
  months = 6,
): T[] {
  const map = new Map(rows.map((r) => [r.label, r]));
  const out: T[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const label = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    out.push(map.get(label) ?? empty(label));
  }
  return out;
}

export async function getDashboardOverview(): Promise<DashboardOverview> {
  await ensureUserExtraColumns();
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
  `.catch(() => undefined);

  const [
    studentsRows,
    teachersRows,
    coursesRows,
    subsRows,
    salesRows,
    libraryRows,
    jobsRows,
    messagesRows,
    activeRows,
    progressRows,
    enrollRows,
    completedProgressRows,
    regMonthRows,
    salesMonthRows,
    subMonthRows,
  ] = await Promise.all([
    sql`SELECT COUNT(*)::int AS c FROM "User" WHERE role = 'STUDENT'`.catch(() => [{ c: 0 }]),
    sql`SELECT COUNT(*)::int AS c FROM "User" WHERE role = 'TEACHER'`.catch(() => [{ c: 0 }]),
    sql`SELECT COUNT(*)::int AS c FROM "Course"`.catch(() => [{ c: 0 }]),
    sql`SELECT COUNT(DISTINCT user_id)::int AS c FROM "UserPlatformSubscription" WHERE expires_at > NOW()`.catch(
      () => [{ c: 0 }],
    ),
    sql`
      SELECT COUNT(*)::int AS c, COALESCE(SUM(price_paid), 0)::float AS revenue
      FROM "UserPlatformSubscription"
    `.catch(() => [{ c: 0, revenue: 0 }]),
    sql`SELECT COUNT(*)::int AS c FROM "StoreProduct"`.catch(() => [{ c: 0 }]),
    sql`SELECT COUNT(*)::int AS c FROM "JobPosting"`.catch(() => [{ c: 0 }]),
    sql`SELECT COUNT(*)::int AS c FROM "Message" WHERE read_at IS NULL`.catch(() => [{ c: 0 }]),
    sql`
      SELECT COUNT(*)::int AS c FROM "User"
      WHERE last_login_at IS NOT NULL AND last_login_at > NOW() - INTERVAL '7 days'
    `.catch(() => [{ c: 0 }]),
    sql`SELECT COALESCE(AVG(percent), 0)::float AS avg FROM "LessonWatchProgress"`.catch(() => [{ avg: 0 }]),
    sql`SELECT COUNT(*)::int AS c FROM "Enrollment"`.catch(() => [{ c: 0 }]),
    sql`
      SELECT COUNT(DISTINCT user_id || ':' || lesson_id)::int AS c
      FROM "LessonWatchProgress" WHERE percent >= 90
    `.catch(() => [{ c: 0 }]),
    sql`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS label, COUNT(*)::int AS count
      FROM "User" WHERE role = 'STUDENT'
      GROUP BY 1 ORDER BY 1 DESC LIMIT 6
    `.catch(() => []),
    sql`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS label,
             COALESCE(SUM(price_paid), 0)::float AS amount
      FROM "UserPlatformSubscription"
      GROUP BY 1 ORDER BY 1 DESC LIMIT 6
    `.catch(() => []),
    sql`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS label, COUNT(*)::int AS count
      FROM "UserPlatformSubscription"
      GROUP BY 1 ORDER BY 1 DESC LIMIT 6
    `.catch(() => []),
  ]);

  const enrollments = num(enrollRows, "c");
  const completedLessons = num(completedProgressRows, "c");
  const courseCompletionRate =
    enrollments > 0 ? Math.min(100, (completedLessons / Math.max(enrollments, 1)) * 10) : 0;

  return {
    students: num(studentsRows, "c"),
    teachers: num(teachersRows, "c"),
    courses: num(coursesRows, "c"),
    activeSubscribers: num(subsRows, "c"),
    salesCount: num(salesRows, "c"),
    salesRevenue: num(salesRows, "revenue"),
    libraryFiles: num(libraryRows, "c"),
    jobs: num(jobsRows, "c"),
    unreadMessages: num(messagesRows, "c"),
    activeUsers: num(activeRows, "c"),
    avgTraineeProgress: num(progressRows, "avg"),
    courseCompletionRate,
    registrationsByMonth: padLastMonths(
      (regMonthRows as { label: string; count: number }[]).map((r) => ({
        label: String(r.label),
        count: Number(r.count),
      })),
      (label) => ({ label, count: 0 }),
    ),
    salesByMonth: padLastMonths(
      (salesMonthRows as { label: string; amount: number }[]).map((r) => ({
        label: String(r.label),
        amount: Number(r.amount),
      })),
      (label) => ({ label, amount: 0 }),
    ),
    newSubscriptionsByMonth: padLastMonths(
      (subMonthRows as { label: string; count: number }[]).map((r) => ({
        label: String(r.label),
        count: Number(r.count),
      })),
      (label) => ({ label, count: 0 }),
    ),
  };
}
