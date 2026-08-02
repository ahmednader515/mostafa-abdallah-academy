/**
 * Student dashboard data aggregation + flags persistence.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import {
  DEFAULT_STUDENT_DASHBOARD_FLAGS,
  parseStudentDashboardFlags,
  serializeStudentDashboardFlags,
  type StudentDashboardFlags,
} from "@/lib/student-dashboard-flags";
import {
  getAccessibleCoursesForUser,
  getCourseProgressForUser,
  getLatestPlatformSubscriptionExpiry,
  getUnreadMessageCount,
  getUserById,
  listStudentStorePurchases,
  userHasActivePlatformSubscription,
} from "@/lib/db";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL غير معرّف");
const sql = neon(connectionString);

async function ensureStudentDashboardFlagsColumn() {
  await sql`ALTER TABLE "HomepageSetting" ADD COLUMN IF NOT EXISTS student_dashboard_flags_json TEXT`.catch(
    () => undefined,
  );
}

export async function getStudentDashboardFlags(): Promise<StudentDashboardFlags> {
  await ensureStudentDashboardFlagsColumn();
  try {
    const rows = await sql`
      SELECT student_dashboard_flags_json FROM "HomepageSetting" WHERE id = 'default' LIMIT 1
    `;
    const raw = (rows[0] as { student_dashboard_flags_json?: string | null } | undefined)
      ?.student_dashboard_flags_json;
    return parseStudentDashboardFlags(raw);
  } catch {
    return { ...DEFAULT_STUDENT_DASHBOARD_FLAGS };
  }
}

export async function updateStudentDashboardFlags(flags: StudentDashboardFlags): Promise<void> {
  await ensureStudentDashboardFlagsColumn();
  const json = serializeStudentDashboardFlags(flags);
  await sql`
    UPDATE "HomepageSetting"
    SET student_dashboard_flags_json = ${json}, updated_at = NOW()
    WHERE id = 'default'
  `;
}

export type StudentCourseCardData = {
  id: string;
  title: string;
  titleAr: string | null;
  slug: string | null;
  imageUrl: string | null;
  instructorName: string | null;
  percent: number;
  completedLessons: number;
  totalLessons: number;
  remainingLessons: number;
  lastLessonTitle: string | null;
  lastLessonSlug: string | null;
  continueHref: string;
  accessKind: "enrolled" | "subscription" | "free" | "purchased";
};

export type StudentOverview = {
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    image: string | null;
    balance: number;
  };
  subscription: {
    active: boolean;
    planId: string | null;
    planName: string | null;
    startsAt: string | null;
    expiresAt: string | null;
    coversCourses: boolean;
    coversLibrary: boolean;
  };
  overallProgress: number;
  lastActivity: {
    kind: string;
    title: string;
    href: string;
    at: string | null;
  } | null;
  courseCount: number;
  unreadMessages: number;
};

async function getLessonsAndQuizzes(courseId: string) {
  const [lessons, quizzes] = await Promise.all([
    sql`
      SELECT id, title, slug, "order"
      FROM "Lesson"
      WHERE course_id = ${courseId}
      ORDER BY "order" ASC, created_at ASC
    `.catch(() => []),
    sql`
      SELECT id FROM "Quiz" WHERE course_id = ${courseId}
    `.catch(() => []),
  ]);
  return {
    lessons: (lessons as { id: string; title: string; slug: string | null; order: number }[]).map(
      (l) => ({
        id: String(l.id),
        title: String(l.title ?? ""),
        slug: l.slug ? String(l.slug) : null,
        order: Number(l.order ?? 0),
      }),
    ),
    quizzes: (quizzes as { id: string }[]).map((q) => ({ id: String(q.id) })),
  };
}

async function getLastWatchedLesson(userId: string, courseId: string) {
  try {
    const rows = await sql`
      SELECT l.title, l.slug, w.updated_at
      FROM "LessonWatchProgress" w
      INNER JOIN "Lesson" l ON l.id = w.lesson_id
      WHERE w.user_id = ${userId} AND l.course_id = ${courseId}
      ORDER BY w.updated_at DESC
      LIMIT 1
    `;
    const r = rows[0] as { title?: string; slug?: string; updated_at?: Date } | undefined;
    if (!r) return null;
    return {
      title: String(r.title ?? ""),
      slug: r.slug ? String(r.slug) : null,
      at: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at ?? ""),
    };
  } catch {
    return null;
  }
}

export async function getStudentCoursesWithProgress(userId: string): Promise<StudentCourseCardData[]> {
  const courses = await getAccessibleCoursesForUser(userId).catch(() => []);
  const out: StudentCourseCardData[] = [];

  for (const c of courses as Record<string, unknown>[]) {
    const id = String(c.id ?? "");
    if (!id) continue;
    const slug = c.slug ? String(c.slug) : null;
    const { lessons, quizzes } = await getLessonsAndQuizzes(id);
    const progress = await getCourseProgressForUser(userId, id, lessons, quizzes).catch(() => ({
      percent: 0,
      completedItems: 0,
      totalItems: lessons.length + quizzes.length,
      completedLessonIds: [] as string[],
    }));
    const last = await getLastWatchedLesson(userId, id);
    const completedLessons = progress.completedLessonIds?.length ?? 0;
    const totalLessons = lessons.length;
    const price = Number(c.price ?? 0);
    let accessKind: StudentCourseCardData["accessKind"] = "enrolled";
    if (price === 0) accessKind = "free";

    const firstIncomplete = lessons.find((l) => !progress.completedLessonIds?.includes(l.id));
    const resumeLesson = last?.slug
      ? last
      : firstIncomplete
        ? { title: firstIncomplete.title, slug: firstIncomplete.slug, at: null }
        : lessons[0]
          ? { title: lessons[0].title, slug: lessons[0].slug, at: null }
          : null;

    const continueHref =
      slug && resumeLesson?.slug
        ? `/courses/${encodeURIComponent(slug)}/lessons/${encodeURIComponent(resumeLesson.slug)}`
        : slug
          ? `/courses/${encodeURIComponent(slug)}`
          : "/courses";

    out.push({
      id,
      title: String(c.title ?? ""),
      titleAr: c.titleAr != null ? String(c.titleAr) : c.title_ar != null ? String(c.title_ar) : null,
      slug,
      imageUrl:
        c.imageUrl != null
          ? String(c.imageUrl)
          : c.image_url != null
            ? String(c.image_url)
            : null,
      instructorName:
        c.instructorName != null
          ? String(c.instructorName)
          : c.instructor_name != null
            ? String(c.instructor_name)
            : null,
      percent: progress.percent,
      completedLessons,
      totalLessons,
      remainingLessons: Math.max(0, totalLessons - completedLessons),
      lastLessonTitle: resumeLesson?.title ?? null,
      lastLessonSlug: resumeLesson?.slug ?? null,
      continueHref,
      accessKind,
    });
  }

  return out;
}

export async function getStudentOverview(userId: string): Promise<StudentOverview | null> {
  const user = await getUserById(userId);
  if (!user) return null;

  const [hasSub, courses, unreadMessages] = await Promise.all([
    userHasActivePlatformSubscription(userId).catch(() => false),
    getStudentCoursesWithProgress(userId),
    getUnreadMessageCount(userId).catch(() => 0),
  ]);

  let planId: string | null = null;
  let planName: string | null = null;
  let expiresAt: string | null = null;
  let startsAt: string | null = null;
  let coversCourses = true;
  let coversLibrary = true;

  if (hasSub) {
    const exp = await getLatestPlatformSubscriptionExpiry(userId).catch(() => null);
    expiresAt = exp ? exp.toISOString() : null;
    try {
      const rows = await sql`
        SELECT ups.created_at, ups.plan_id, sp.name, sp.covers_courses, sp.covers_library
        FROM "UserPlatformSubscription" ups
        LEFT JOIN "SubscriptionPlan" sp ON sp.id = ups.plan_id
        WHERE ups.user_id = ${userId} AND ups.expires_at > NOW()
        ORDER BY ups.expires_at DESC
        LIMIT 1
      `;
      const r = rows[0] as Record<string, unknown> | undefined;
      if (r) {
        planId = r.plan_id ? String(r.plan_id) : null;
        planName = r.name ? String(r.name) : null;
        startsAt =
          r.created_at instanceof Date
            ? r.created_at.toISOString()
            : r.created_at
              ? String(r.created_at)
              : null;
        coversCourses = r.covers_courses == null ? true : Boolean(r.covers_courses);
        coversLibrary = r.covers_library == null ? true : Boolean(r.covers_library);
      }
    } catch {
      /* ignore */
    }
  }

  const overallProgress =
    courses.length > 0
      ? Math.round(courses.reduce((s, c) => s + c.percent, 0) / courses.length)
      : 0;

  const lastCourse = courses.find((c) => c.lastLessonTitle);
  const lastActivity = lastCourse
    ? {
        kind: "lesson",
        title: lastCourse.lastLessonTitle || lastCourse.title,
        href: lastCourse.continueHref,
        at: null as string | null,
      }
    : null;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email ?? null,
      phone: (user as { phone?: string | null }).phone ?? null,
      image: (user as { image?: string | null }).image ?? null,
      balance: Number(user.balance ?? 0),
    },
    subscription: {
      active: hasSub,
      planId,
      planName,
      startsAt,
      expiresAt,
      coversCourses,
      coversLibrary,
    },
    overallProgress,
    lastActivity,
    courseCount: courses.length,
    unreadMessages: Number(unreadMessages ?? 0),
  };
}

export async function getStudentPurchases(userId: string) {
  const [payments, store] = await Promise.all([
    sql`
      SELECT p.id, p.amount, p.created_at, c.title, c.title_ar, c.slug
      FROM "Payment" p
      LEFT JOIN "Course" c ON c.id = p.course_id
      WHERE p.user_id = ${userId}
      ORDER BY p.created_at DESC
      LIMIT 100
    `.catch(() => []),
    listStudentStorePurchases(userId).catch(() => []),
  ]);

  return {
    courses: (payments as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      title: String(r.title_ar || r.title || "Course"),
      slug: r.slug ? String(r.slug) : null,
      amount: Number(r.amount ?? 0),
      at:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : String(r.created_at ?? ""),
      kind: "course" as const,
    })),
    products: store.map((p) => ({
      id: p.purchaseId,
      productId: p.productId,
      title: p.title,
      amount: p.pricePaid,
      at: p.createdAt,
      kind: "store" as const,
      pdfUrl: p.pdfUrl,
    })),
  };
}

export async function getStudentHomework(userId: string) {
  try {
    const rows = await sql`
      SELECT
        l.id AS lesson_id,
        l.title AS lesson_title,
        l.slug AS lesson_slug,
        c.id AS course_id,
        c.title AS course_title,
        c.title_ar AS course_title_ar,
        c.slug AS course_slug,
        hs.id AS submission_id,
        hs.status,
        hs.grade,
        hs.feedback,
        hs.created_at AS submitted_at,
        hs.file_url,
        hs.link_url
      FROM "Lesson" l
      INNER JOIN "Course" c ON c.id = l.course_id
      INNER JOIN "Enrollment" e ON e.course_id = c.id AND e.user_id = ${userId}
      LEFT JOIN "HomeworkSubmission" hs ON hs.lesson_id = l.id AND hs.user_id = ${userId}
      WHERE c.accepts_homework = true OR l.accepts_homework = true
      ORDER BY l."order" ASC
      LIMIT 100
    `;
    return (rows as Record<string, unknown>[]).map((r) => ({
      lessonId: String(r.lesson_id),
      lessonTitle: String(r.lesson_title ?? ""),
      lessonSlug: r.lesson_slug ? String(r.lesson_slug) : null,
      courseId: String(r.course_id),
      courseTitle: String(r.course_title_ar || r.course_title || ""),
      courseSlug: r.course_slug ? String(r.course_slug) : null,
      submissionId: r.submission_id ? String(r.submission_id) : null,
      status: r.submission_id ? String(r.status ?? "submitted") : "pending",
      grade: r.grade != null ? Number(r.grade) : null,
      feedback: r.feedback ? String(r.feedback) : null,
      submittedAt:
        r.submitted_at instanceof Date
          ? r.submitted_at.toISOString()
          : r.submitted_at
            ? String(r.submitted_at)
            : null,
      fileUrl: r.file_url ? String(r.file_url) : null,
      linkUrl: r.link_url ? String(r.link_url) : null,
      href:
        r.course_slug && r.lesson_slug
          ? `/courses/${encodeURIComponent(String(r.course_slug))}/lessons/${encodeURIComponent(String(r.lesson_slug))}`
            : "/dashboard/my-courses",
    }));
  } catch {
    // Fallback: lessons in enrolled courses (without accepts_homework column)
    try {
      const rows = await sql`
        SELECT
          l.id AS lesson_id,
          l.title AS lesson_title,
          l.slug AS lesson_slug,
          c.id AS course_id,
          c.title AS course_title,
          c.title_ar AS course_title_ar,
          c.slug AS course_slug,
          hs.id AS submission_id,
          hs.created_at AS submitted_at,
          hs.file_url
        FROM "HomeworkSubmission" hs
        INNER JOIN "Lesson" l ON l.id = hs.lesson_id
        INNER JOIN "Course" c ON c.id = l.course_id
        WHERE hs.user_id = ${userId}
        ORDER BY hs.created_at DESC
        LIMIT 50
      `;
      return (rows as Record<string, unknown>[]).map((r) => ({
        lessonId: String(r.lesson_id),
        lessonTitle: String(r.lesson_title ?? ""),
        lessonSlug: r.lesson_slug ? String(r.lesson_slug) : null,
        courseId: String(r.course_id),
        courseTitle: String(r.course_title_ar || r.course_title || ""),
        courseSlug: r.course_slug ? String(r.course_slug) : null,
        submissionId: r.submission_id ? String(r.submission_id) : null,
        status: "submitted",
        grade: null as number | null,
        feedback: null as string | null,
        submittedAt:
          r.submitted_at instanceof Date
            ? r.submitted_at.toISOString()
            : r.submitted_at
              ? String(r.submitted_at)
              : null,
        fileUrl: r.file_url ? String(r.file_url) : null,
        linkUrl: null as string | null,
        href:
          r.course_slug && r.lesson_slug
            ? `/courses/${encodeURIComponent(String(r.course_slug))}/lessons/${encodeURIComponent(String(r.lesson_slug))}`
            : "/dashboard/my-courses",
      }));
    } catch {
      return [];
    }
  }
}

export async function searchStudentAccount(userId: string, q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return { courses: [], products: [], certificates: [] };

  const courses = (await getStudentCoursesWithProgress(userId)).filter((c) => {
    const t = `${c.title} ${c.titleAr ?? ""} ${c.slug ?? ""}`.toLowerCase();
    return t.includes(query);
  });

  const purchases = await getStudentPurchases(userId);
  const products = purchases.products.filter((p) => p.title.toLowerCase().includes(query));

  let certificates: { id: string; title: string; href: string }[] = [];
  try {
    const rows = await sql`
      SELECT id, certificate_id, course_title, issued_at FROM "Certificate"
      WHERE user_id = ${userId}
      ORDER BY issued_at DESC
      LIMIT 50
    `;
    certificates = (rows as Record<string, unknown>[])
      .map((r) => ({
        id: String(r.id),
        title: String(r.course_title ?? "Certificate"),
        href: `/certificate/${encodeURIComponent(String(r.certificate_id ?? r.id))}`,
      }))
      .filter((c) => c.title.toLowerCase().includes(query));
  } catch {
    certificates = [];
  }

  return { courses, products, certificates };
}

export async function listStudentLoginDevices(userId: string) {
  try {
    const rows = await sql`
      SELECT id, ip, user_agent, created_at
      FROM "UserLoginLog"
      WHERE user_id = ${userId}
        AND (status IS NULL OR status = 'success')
      ORDER BY created_at DESC
      LIMIT 20
    `;
    return (rows as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      ip: r.ip ? String(r.ip) : null,
      userAgent: r.user_agent ? String(r.user_agent) : null,
      at:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : String(r.created_at ?? ""),
    }));
  } catch {
    return [];
  }
}
