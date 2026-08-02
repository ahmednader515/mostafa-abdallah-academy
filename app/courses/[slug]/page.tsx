import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_noStore } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCourseWithContent,
  getEnrollment,
  getAllowedLessonIdsForUserCourse,
  getAllowedQuizIdsForUserCourse,
  getUserById,
  getLiveStreamsByCourseId,
  hasFullCourseAccessAsStudent,
  userHasActivePlatformSubscriptionForPaidCourse,
  userHasActivePlatformSubscription,
  getLatestPlatformSubscriptionExpiry,
} from "@/lib/db";
import { listCourseSections } from "@/lib/course-sections-db";
import { MetaViewContent } from "@/components/MetaViewContent";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import { pickLocalizedText } from "@/lib/i18n/localized-field";
import { CourseDetailHero } from "@/components/course-detail/CourseDetailHero";
import { CoursePurchaseCard } from "@/components/course-detail/CoursePurchaseCard";
import { CourseIntroMedia } from "@/components/course-detail/CourseIntroMedia";
import { CourseAboutSection } from "@/components/course-detail/CourseAboutSection";
import {
  CourseCurriculumAccordions,
  type CurriculumLesson,
  type CurriculumSection,
} from "@/components/course-detail/CourseCurriculumAccordions";
import { CourseLearningOutcomes } from "@/components/course-detail/CourseLearningOutcomes";
import { CourseInstructorBlock } from "@/components/course-detail/CourseInstructorBlock";
import { CourseBottomCta } from "@/components/course-detail/CourseBottomCta";
import { CourseRatingSection } from "@/components/CourseRatingSection";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lp?: string }>;
};

/** عدم التخزين المؤقت — دائماً التحقق من وجود الدورة (تجنب 404 للدورات المحذوفة) */
export const dynamic = "force-dynamic";
export const revalidate = 0;

function decodeSlug(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function normalizeSlugForUrl(s: string | null | undefined): string {
  if (!s || !s.trim()) return "";
  return s.trim().replace(/-+$/, "").replace(/^-+/, "");
}

function fillTemplate(template: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, v), template);
}

function lessonIsPreview(lesson: Record<string, unknown>): boolean {
  return Boolean(lesson.isPreview ?? lesson.is_preview);
}

function lessonSectionId(lesson: Record<string, unknown>): string | null {
  const sid = lesson.sectionId ?? lesson.section_id;
  return sid != null && String(sid).trim() ? String(sid) : null;
}

export async function generateMetadata({ params }: Props) {
  const [t, locale] = await Promise.all([getServerTranslator(), getLocaleFromCookie()]);
  const { slug: segment } = await params;
  unstable_noStore();
  const decoded = decodeSlug(segment);
  const data = await getCourseWithContent(decoded);
  const course = data?.course;
  if (!course) return { title: t("courses.notFoundCourse", "Course not found") };
  const courseTitle = pickLocalizedText(
    locale,
    (course as { titleAr?: string | null; title?: string | null }).titleAr ?? null,
    (course as { title?: string | null }).title ?? null,
  );
  const courseDescription = pickLocalizedText(
    locale,
    (course as { shortDesc?: string | null; description?: string | null }).shortDesc ??
      (course as { description?: string | null }).description ??
      null,
    (course as { shortDescEn?: string | null; short_desc_en?: string | null }).shortDescEn ??
      (course as { short_desc_en?: string | null }).short_desc_en ??
      null,
  );
  return {
    title: `${courseTitle} | ${t("footer.defaultTitle", "My Learning Platform")}`,
    description: courseDescription,
  };
}

export default async function CoursePage({ params, searchParams }: Props) {
  unstable_noStore();
  const t = await getServerTranslator();
  const locale = await getLocaleFromCookie();
  const { slug: segment } = await params;
  const sp = await searchParams;
  const landingSlug = sp.lp?.trim() || "";
  const decoded = decodeSlug(segment);
  const session = await getServerSession(authOptions);
  let data: Awaited<ReturnType<typeof getCourseWithContent>> = null;
  let isEnrolled = false;
  let allowedLessonIds: string[] = [];
  let allowedQuizIds: string[] = [];
  let userBalance = 0;
  let hasFullStudentAccess = false;
  let paidCourseCoveredBySubscription = false;
  let hasActivePlatformSub = false;
  let subscriptionExpiresAt: Date | null = null;
  try {
    data = await getCourseWithContent(decoded);
    if (data?.course && session?.user?.id && session.user.role === "STUDENT") {
      const [en, user, lessons, quizzes, fullAccess, subPaid, subActive] = await Promise.all([
        getEnrollment(session.user.id, data.course.id),
        getUserById(session.user.id),
        getAllowedLessonIdsForUserCourse(session.user.id, data.course.id),
        getAllowedQuizIdsForUserCourse(session.user.id, data.course.id),
        hasFullCourseAccessAsStudent(session.user.id, data.course.id),
        userHasActivePlatformSubscriptionForPaidCourse(session.user.id, data.course.id),
        userHasActivePlatformSubscription(session.user.id),
      ]);
      isEnrolled = !!en;
      if (!isEnrolled) {
        allowedLessonIds = lessons;
        allowedQuizIds = quizzes;
      }
      userBalance = Number(user?.balance) || 0;
      hasFullStudentAccess = fullAccess;
      hasActivePlatformSub = subActive;
      paidCourseCoveredBySubscription = subPaid && !isEnrolled;
      if (paidCourseCoveredBySubscription) {
        subscriptionExpiresAt = await getLatestPlatformSubscriptionExpiry(session.user.id);
      }
    }
  } catch {
    notFound();
  }
  if (!data?.course) notFound();

  const course = {
    ...data.course,
    lessons: data.lessons,
    quizzes: data.quizzes,
  };
  const courseRec = course as Record<string, unknown>;
  const title = pickLocalizedText(
    locale,
    (course as { titleAr?: string | null; title?: string | null }).titleAr ?? null,
    (course as { title?: string | null }).title ?? null,
  );
  const categoryName = pickLocalizedText(
    locale,
    (course.category as { nameAr?: string | null; name?: string | null })?.nameAr ?? null,
    (course.category as { name?: string | null })?.name ?? null,
  );
  const courseDescription = pickLocalizedText(
    locale,
    (course as { description?: string | null }).description ?? null,
    (course as { descriptionEn?: string | null; description_en?: string | null }).descriptionEn ??
      (course as { description_en?: string | null }).description_en ??
      null,
  );
  const shortDescription = pickLocalizedText(
    locale,
    (course as { shortDesc?: string | null; short_desc?: string | null }).shortDesc ??
      (course as { short_desc?: string | null }).short_desc ??
      courseDescription,
    (course as { shortDescEn?: string | null; short_desc_en?: string | null }).shortDescEn ??
      (course as { short_desc_en?: string | null }).short_desc_en ??
      null,
  );

  const canEnroll =
    session?.user?.role === "STUDENT" && !isEnrolled && !paidCourseCoveredBySubscription;
  const hasPartialAccess = allowedLessonIds.length > 0 || allowedQuizIds.length > 0;
  const isStaff = session?.user?.role === "ADMIN" || session?.user?.role === "ASSISTANT_ADMIN";
  const canAccessContent =
    isStaff || hasPartialAccess || (session?.user?.role === "STUDENT" && hasFullStudentAccess);
  const canAccessQuizzes = isStaff || (session?.user?.role === "STUDENT" && hasFullStudentAccess);
  const coursePrice = Number(courseRec.price) || 0;
  const compareAtRaw = courseRec.compareAtPrice ?? courseRec.compare_at_price;
  const compareAtPrice =
    compareAtRaw != null && compareAtRaw !== "" && Number.isFinite(Number(compareAtRaw))
      ? Number(compareAtRaw)
      : null;
  const discountPercent =
    compareAtPrice != null && compareAtPrice > coursePrice && coursePrice >= 0
      ? Math.round(((compareAtPrice - coursePrice) / compareAtPrice) * 100)
      : null;

  const imageUrl = (courseRec.imageUrl ?? courseRec.image_url)
    ? String(courseRec.imageUrl ?? courseRec.image_url)
    : null;
  const duration = courseRec.duration ? String(courseRec.duration) : null;
  const level = courseRec.level ? String(courseRec.level) : null;
  const levelLabel =
    level === "beginner"
      ? t("common.beginner", "Beginner")
      : level === "intermediate"
        ? t("common.intermediate", "Intermediate")
        : level === "advanced"
          ? t("common.advanced", "Advanced")
          : level;

  const courseSlugOrId =
    normalizeSlugForUrl(String(courseRec.slug ?? "")) || String(courseRec.id ?? course.id);
  const coursePath = `/courses/${encodeURIComponent(String(courseRec.slug ?? "").trim() || String(course.id))}`;

  const sections = await listCourseSections(course.id);
  const allLessons = course.lessons as Record<string, unknown>[];

  const buildLessonHref = (lesson: Record<string, unknown>) => {
    const lessonSlugOrId =
      lesson.slug && String(lesson.slug).trim()
        ? encodeURIComponent(String(lesson.slug).trim())
        : String(lesson.id ?? "");
    return `/courses/${courseSlugOrId}/lessons/${lessonSlugOrId}`;
  };

  const lessonTitle = (lesson: Record<string, unknown>) =>
    pickLocalizedText(
      locale,
      (lesson.titleAr as string | null | undefined) ?? (lesson.title_ar as string | null | undefined) ?? null,
      (lesson.title as string | null | undefined) ?? null,
    ) || String(lesson.title ?? "");

  const canOpenLesson = (lesson: Record<string, unknown>) => {
    if (isStaff || isEnrolled || hasFullStudentAccess) return true;
    if (lessonIsPreview(lesson)) return true;
    const lid = String(lesson.id ?? "");
    return allowedLessonIds.includes(lid);
  };

  const toCurriculumLesson = (lesson: Record<string, unknown>): CurriculumLesson => {
    const preview = lessonIsPreview(lesson);
    const open = canOpenLesson(lesson);
    const dur = lesson.duration;
    return {
      id: String(lesson.id ?? ""),
      title: lessonTitle(lesson),
      href: buildLessonHref(lesson),
      durationLabel:
        dur != null && dur !== ""
          ? `${dur} ${t("courses.minutes", "minutes")}`
          : null,
      isPreview: preview,
      sectionId: lessonSectionId(lesson),
      locked: !open,
    };
  };

  const freeLessons = allLessons.filter(lessonIsPreview).map(toCurriculumLesson);
  const paidSourceLessons = allLessons.filter((l) => !lessonIsPreview(l));

  const sectionMap = new Map(sections.map((s) => [s.id, s]));
  const paidBySection = new Map<string, CurriculumLesson[]>();
  const unsectioned: CurriculumLesson[] = [];

  for (const lesson of paidSourceLessons) {
    const item = toCurriculumLesson(lesson);
    const sid = item.sectionId;
    if (sid && sectionMap.has(sid)) {
      const list = paidBySection.get(sid) ?? [];
      list.push(item);
      paidBySection.set(sid, list);
    } else {
      unsectioned.push(item);
    }
  }

  const paidSections: CurriculumSection[] = [];
  for (const section of sections) {
    const lessonsInSection = paidBySection.get(section.id) ?? [];
    if (lessonsInSection.length === 0) continue;
    paidSections.push({
      id: section.id,
      title:
        pickLocalizedText(locale, section.titleAr, section.title) ||
        section.titleAr ||
        section.title,
      lessons: lessonsInSection,
    });
  }
  if (unsectioned.length > 0) {
    paidSections.push({
      id: "extra",
      title: t("courses.detailExtraSection", "Additional content"),
      lessons: unsectioned,
    });
  }

  const introPreview = allLessons.find(
    (l) => lessonIsPreview(l) && String(l.videoUrl ?? l.video_url ?? "").trim()
  );
  const introVideoUrl = introPreview
    ? String(introPreview.videoUrl ?? introPreview.video_url ?? "")
    : null;

  const teacherImage =
    (courseRec.teacherImageUrl ?? courseRec.teacher_image_url)
      ? String(courseRec.teacherImageUrl ?? courseRec.teacher_image_url)
      : null;
  const teacherBio = pickLocalizedText(
    locale,
    (courseRec.teacherDescription as string | null | undefined) ??
      (courseRec.teacher_description as string | null | undefined) ??
      null,
    (courseRec.teacherDescriptionEn as string | null | undefined) ??
      (courseRec.teacher_description_en as string | null | undefined) ??
      null,
  );
  const createdById = String(courseRec.createdById ?? courseRec.created_by_id ?? "");
  let instructorName = "";
  if (createdById) {
    try {
      const creator = await getUserById(createdById);
      instructorName = creator?.name?.trim() || "";
    } catch {
      instructorName = "";
    }
  }

  const iconsJson =
    (courseRec.iconsJson as string | null | undefined) ??
    (courseRec.icons_json as string | null | undefined) ??
    null;

  const rating =
    courseRec.courseRating != null
      ? Number(courseRec.courseRating)
      : courseRec.course_rating != null
        ? Number(courseRec.course_rating)
        : null;
  const ratingCount = Number(courseRec.courseRatingCount ?? courseRec.course_rating_count ?? 0);
  const badge =
    courseRec.badge != null && String(courseRec.badge).trim()
      ? String(courseRec.badge)
      : null;

  const liveStreams = canAccessContent ? await getLiveStreamsByCourseId(course.id) : [];
  const formatStreamDate = (d: Date | string) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const isGuest = !session;
  const purchaseFeatures = [
    {
      label: fillTemplate(t("courses.detailFeatureLectures", "{count} lectures"), {
        count: String(allLessons.length),
      }),
    },
    ...(duration
      ? [
          {
            label: fillTemplate(t("courses.detailFeatureDuration", "Duration: {duration}"), {
              duration,
            }),
          },
        ]
      : []),
    { label: t("courses.detailCertificate", "Certificate of completion") },
    { label: t("courses.detailLifetimeAccess", "Lifetime access") },
    { label: t("courses.detailMultiDevice", "Watch on any device") },
  ];

  const firstAccessibleLesson = allLessons.find((l) => canOpenLesson(l));
  const startHref = firstAccessibleLesson
    ? buildLessonHref(firstAccessibleLesson)
    : coursePath;

  const guestPrompt = isGuest ? (
    <div className="mb-4 rounded-[var(--radius-btn)] border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 px-3 py-3">
      <p className="text-sm text-[var(--color-foreground)]">
        {t("courses.enrollLoginPrompt", "Log in or create an account to view this course content and enroll.")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(coursePath)}`}
          className="inline-flex rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium"
        >
          {t("header.login", "Log in")}
        </Link>
        <Link
          href={`/register?callbackUrl=${encodeURIComponent(coursePath)}`}
          className="inline-flex rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-white"
        >
          {t("header.register", "Create account")}
        </Link>
      </div>
    </div>
  ) : null;

  const subscriptionBlocked =
    !!canEnroll && hasActivePlatformSub && !paidCourseCoveredBySubscription && coursePrice > 0;

  return (
    <div className="pb-0">
      <MetaViewContent
        contentId={String(courseRec.id ?? "")}
        contentName={title}
        contentType="product"
        contentCategory={categoryName || "course"}
        value={coursePrice}
        currency="EGP"
      />

      <CourseDetailHero
        title={title}
        shortDescription={shortDescription}
        imageUrl={imageUrl}
        categoryName={categoryName}
        languageLabel={locale === "ar" ? "العربية" : "English"}
        lessonsCount={allLessons.length}
        lessonsLabel={t("courses.detailLessonsWord", "lectures")}
        duration={duration}
        levelLabel={levelLabel}
        backHref="/courses"
        backLabel={t("common.backToCourses", "Back to courses")}
        badge={badge}
        rating={rating}
        ratingCount={ratingCount}
        ratingLabel={
          rating != null && ratingCount > 0
            ? fillTemplate(
                t("courses.courseRatingAverageLine", "Course rating (all lectures): {rating}/5 ({count} ratings)"),
                { rating: String(rating), count: String(ratingCount) }
              )
            : undefined
        }
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:pb-16">
        <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10">
          <aside className="order-1 lg:order-2">
            <CoursePurchaseCard
              courseId={course.id}
              price={coursePrice}
              compareAtPrice={compareAtPrice}
              discountPercent={discountPercent}
              discountBadgeLabel={
                discountPercent != null && discountPercent > 0
                  ? fillTemplate(t("courses.detailDiscountPercent", "{percent}% off"), {
                      percent: String(discountPercent),
                    })
                  : null
              }
              features={purchaseFeatures}
              canEnroll={!!canEnroll && !subscriptionBlocked}
              userBalance={userBalance}
              landingSlug={landingSlug}
              isEnrolled={isEnrolled || paidCourseCoveredBySubscription}
              enrolledMessage={
                paidCourseCoveredBySubscription && subscriptionExpiresAt ? (
                  <>
                    {t(
                      "courses.viaPlatformSubscription",
                      "You are viewing this course through platform subscription until"
                    )}{" "}
                    {new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(subscriptionExpiresAt)}
                    .
                  </>
                ) : (
                  <>
                    ✓ {t("courses.youAreEnrolled", "You are enrolled in this course.")}{" "}
                    <Link href="/dashboard" className="font-medium underline">
                      {t("dashboard.title", "Dashboard")}
                    </Link>
                  </>
                )
              }
              subscriptionBlocked={subscriptionBlocked}
              guestPrompt={guestPrompt}
              enrolledCtaHref={isEnrolled || paidCourseCoveredBySubscription ? startHref : undefined}
              enrolledCtaLabel={t("courses.detailStartLearning", "Start learning")}
              freeLabel={t("courses.detailFreePrice", "Free")}
            />
          </aside>

          <div className="order-2 min-w-0 space-y-10 lg:order-1">
            {hasPartialAccess && !isEnrolled && !hasFullStudentAccess ? (
              <div className="rounded-[var(--radius-card)] border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                {t(
                  "courses.partialAccessInfo",
                  "This course is available to you through a code that unlocks specific lessons/quizzes."
                )}
              </div>
            ) : null}

            <CourseIntroMedia
              title={t("courses.detailIntroVideo", "Course introduction")}
              videoUrl={introVideoUrl}
              imageUrl={imageUrl}
              playLabel={t("courses.detailIntroVideo", "Course introduction")}
            />

            <CourseAboutSection
              title={t("courses.detailAbout", "About this course")}
              description={courseDescription}
              readMoreLabel={t("courses.detailReadMore", "Read more")}
              readLessLabel={t("courses.detailReadLess", "Show less")}
            />

            <CourseCurriculumAccordions
              freeTitle={t("courses.detailFreeContent", "Free content")}
              paidTitle={t("courses.detailPaidContent", "Paid content")}
              freeLessons={freeLessons}
              paidSections={paidSections}
              extraSectionTitle={t("courses.detailExtraSection", "Additional content")}
              lockedLabel={t("courses.detailLocked", "Locked")}
              previewLabel={t("courses.detailPreview", "Free preview")}
              lessonWord={t("courses.detailLessonsWord", "lectures")}
              sectionsWord={t("courses.detailSectionsWord", "sections")}
            />

            {liveStreams.length > 0 ? (
              <section>
                <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
                  {t("courses.liveStreams", "Live streams")}
                </h2>
                <ul className="mt-4 space-y-3">
                  {(liveStreams as unknown as Record<string, unknown>[]).map((ls) => (
                    <li
                      key={String(ls.id)}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                    >
                      <div>
                        <span className="font-medium text-[var(--color-foreground)]">
                          {String(ls.title_ar ?? ls.titleAr ?? ls.title ?? "")}
                        </span>
                        <span className="ms-2 text-sm text-[var(--color-muted)]">
                          {ls.provider === "google_meet" ? "Google Meet" : "Zoom"} —{" "}
                          {formatStreamDate(
                            (ls.scheduled_at ?? ls.scheduledAt) as string | Date || new Date()
                          )}
                        </span>
                      </div>
                      <Link
                        href={`/live/${encodeURIComponent(String(ls.id))}`}
                        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)]"
                      >
                        {t("courses.joinStream", "Watch on platform")}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {course.quizzes && course.quizzes.length > 0 ? (
              <section>
                <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
                  {t("courses.quizzes", "Quizzes")} ({course.quizzes.length})
                </h2>
                <ul className="mt-4 space-y-2">
                  {course.quizzes.map((quiz) => {
                    const q = quiz as Record<string, unknown> & { _count?: { questions?: number } };
                    const questionsCount = q._count?.questions ?? 0;
                    return (
                      <li key={String(q.id)}>
                        {canAccessQuizzes ? (
                          <Link
                            href={`/courses/${encodeURIComponent(normalizeSlugForUrl(String(courseRec.slug ?? "")) || String(course.id))}/quizzes/${String(q.id)}`}
                            className="flex items-center justify-between rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition hover:border-[var(--color-primary)]/30"
                          >
                            <span className="font-medium text-[var(--color-foreground)]">
                              {String(q.title ?? "")}
                            </span>
                            <span className="text-sm text-[var(--color-muted)]">
                              {questionsCount} {t("courses.questions", "questions")}
                            </span>
                          </Link>
                        ) : (
                          <div className="flex items-center justify-between rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 opacity-75">
                            <span className="font-medium text-[var(--color-foreground)]">
                              {String(q.title ?? "")}
                            </span>
                            <span className="text-sm text-[var(--color-muted)]">
                              {questionsCount} {t("courses.questions", "questions")}
                            </span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            <CourseLearningOutcomes
              title={t("courses.detailWhatYouLearn", "What you'll learn")}
              iconsJson={iconsJson}
            />

            <CourseRatingSection
              courseId={course.id}
              canRate={
                session?.user?.role === "STUDENT" &&
                (isEnrolled || hasFullStudentAccess || paidCourseCoveredBySubscription)
              }
            />

            <CourseInstructorBlock
              title={t("courses.detailInstructor", "Instructor")}
              name={instructorName}
              bio={teacherBio}
              imageUrl={teacherImage}
            />
          </div>
        </div>
      </div>

      <CourseBottomCta
        title={t("courses.detailBottomCtaTitle", "Ready to start this course?")}
        subtitle={t(
          "courses.detailBottomCtaSubtitle",
          "Get full access to lectures, quizzes, and course materials."
        )}
        ctaLabel={
          isEnrolled || paidCourseCoveredBySubscription
            ? t("courses.detailStartLearning", "Start learning")
            : t("courses.detailEnrollNow", "Enroll now")
        }
        ctaHref={
          isEnrolled || paidCourseCoveredBySubscription
            ? startHref
            : isGuest
              ? `/login?callbackUrl=${encodeURIComponent(coursePath)}`
              : `${coursePath}#course-purchase`
        }
        secondaryLabel={t("courses.detailBrowseCourses", "Browse courses")}
        secondaryHref="/courses"
      />
    </div>
  );
}
