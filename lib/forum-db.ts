/**
 * منتدى المنصة — أقسام، مواضيع، ردود
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL غير معرّف");

const sql = neon(connectionString);

const ensureOnceMap = new Map<string, Promise<void>>();
function ensureOnce(key: string, fn: () => Promise<void>): Promise<void> {
  const existing = ensureOnceMap.get(key);
  if (existing) return existing;
  const p = fn();
  ensureOnceMap.set(key, p);
  return p;
}

function generateId(): string {
  const part = () => Math.random().toString(36).slice(2, 10);
  return "c" + part() + part() + Date.now().toString(36).slice(-6);
}

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function rowToCamel<T = Record<string, unknown>>(row: Record<string, unknown> | null | undefined): T | null {
  if (!row) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[snakeToCamel(k)] = v;
  return out as T;
}

function rowsToCamel<T = Record<string, unknown>>(rows: Record<string, unknown>[]): T[] {
  return rows.map((r) => rowToCamel(r) as T);
}

export type ForumCategory = {
  id: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  order: number;
  isVisible: boolean;
  createdAt?: Date;
};

export type ForumThread = {
  id: string;
  categoryId: string;
  authorId: string;
  authorName?: string;
  title: string;
  body: string;
  isPinned: boolean;
  isLocked: boolean;
  replyCount?: number;
  lastReplyAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date;
  categoryName?: string;
};

export type ForumReply = {
  id: string;
  threadId: string;
  authorId: string;
  authorName?: string;
  body: string;
  createdAt: Date;
};

export async function ensureForumSchema(): Promise<void> {
  return ensureOnce("ensureForumSchema", async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS "ForumCategory" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        name_ar TEXT,
        description TEXT,
        "order" INT NOT NULL DEFAULT 0,
        is_visible BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "ForumThread" (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL REFERENCES "ForumCategory"(id) ON DELETE CASCADE,
        author_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        is_locked BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS "ForumReply" (
        id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL REFERENCES "ForumThread"(id) ON DELETE CASCADE,
        author_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS "ForumThread_category_idx" ON "ForumThread"(category_id, is_pinned DESC, updated_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS "ForumReply_thread_idx" ON "ForumReply"(thread_id, created_at ASC)`;

    const existing = await sql`SELECT COUNT(*)::int AS c FROM "ForumCategory"`;
    const count = Number((existing[0] as { c?: number })?.c ?? 0);
    if (count === 0) {
      const defaults = [
        { name: "General", name_ar: "عام", description: "نقاشات عامة عن المنصة", order: 0 },
        { name: "Courses Q&A", name_ar: "أسئلة الكورسات", description: "اسأل عن محتوى الكورسات والمحاضرات", order: 1 },
        { name: "Announcements", name_ar: "الإعلانات", description: "إعلانات الفريق والتحديثات", order: 2 },
      ];
      for (const d of defaults) {
        await sql`
          INSERT INTO "ForumCategory" (id, name, name_ar, description, "order", is_visible)
          VALUES (${generateId()}, ${d.name}, ${d.name_ar}, ${d.description}, ${d.order}, true)
        `;
      }
    }
  });
}

export async function listForumCategories(visibleOnly = true): Promise<ForumCategory[]> {
  await ensureForumSchema();
  const rows = visibleOnly
    ? await sql`SELECT * FROM "ForumCategory" WHERE is_visible = true ORDER BY "order" ASC`
    : await sql`SELECT * FROM "ForumCategory" ORDER BY "order" ASC`;
  return rowsToCamel<ForumCategory>(rows as Record<string, unknown>[]);
}

export async function getForumCategoryById(id: string): Promise<ForumCategory | null> {
  await ensureForumSchema();
  const rows = await sql`SELECT * FROM "ForumCategory" WHERE id = ${id} LIMIT 1`;
  return rowToCamel<ForumCategory>(rows[0] as Record<string, unknown>);
}

export async function listForumThreads(categoryId?: string | null, limit = 50): Promise<ForumThread[]> {
  await ensureForumSchema();
  const rows = categoryId
    ? await sql`
        SELECT t.*, u.name AS author_name,
          (SELECT COUNT(*)::int FROM "ForumReply" r WHERE r.thread_id = t.id) AS reply_count,
          (SELECT MAX(r.created_at) FROM "ForumReply" r WHERE r.thread_id = t.id) AS last_reply_at,
          c.name AS category_name, c.name_ar AS category_name_ar
        FROM "ForumThread" t
        JOIN "User" u ON u.id = t.author_id
        JOIN "ForumCategory" c ON c.id = t.category_id
        WHERE t.category_id = ${categoryId}
        ORDER BY t.is_pinned DESC, COALESCE(
          (SELECT MAX(r.created_at) FROM "ForumReply" r WHERE r.thread_id = t.id),
          t.updated_at
        ) DESC
        LIMIT ${limit}
      `
    : await sql`
        SELECT t.*, u.name AS author_name,
          (SELECT COUNT(*)::int FROM "ForumReply" r WHERE r.thread_id = t.id) AS reply_count,
          (SELECT MAX(r.created_at) FROM "ForumReply" r WHERE r.thread_id = t.id) AS last_reply_at,
          c.name AS category_name, c.name_ar AS category_name_ar
        FROM "ForumThread" t
        JOIN "User" u ON u.id = t.author_id
        JOIN "ForumCategory" c ON c.id = t.category_id
        WHERE c.is_visible = true
        ORDER BY t.is_pinned DESC, COALESCE(
          (SELECT MAX(r.created_at) FROM "ForumReply" r WHERE r.thread_id = t.id),
          t.updated_at
        ) DESC
        LIMIT ${limit}
      `;
  return (rows as Record<string, unknown>[]).map((r) => {
    const base = rowToCamel<ForumThread>(r)!;
    return {
      ...base,
      authorName: r.author_name != null ? String(r.author_name) : undefined,
      replyCount: Number(r.reply_count ?? 0),
      lastReplyAt: r.last_reply_at ? new Date(String(r.last_reply_at)) : null,
      categoryName: String(r.category_name_ar || r.category_name || ""),
    };
  });
}

export async function getForumThreadById(id: string): Promise<ForumThread | null> {
  await ensureForumSchema();
  const rows = await sql`
    SELECT t.*, u.name AS author_name,
      (SELECT COUNT(*)::int FROM "ForumReply" r WHERE r.thread_id = t.id) AS reply_count,
      c.name AS category_name, c.name_ar AS category_name_ar
    FROM "ForumThread" t
    JOIN "User" u ON u.id = t.author_id
    JOIN "ForumCategory" c ON c.id = t.category_id
    WHERE t.id = ${id}
    LIMIT 1
  `;
  const r = rows[0] as Record<string, unknown> | undefined;
  if (!r) return null;
  const base = rowToCamel<ForumThread>(r)!;
  return {
    ...base,
    authorName: r.author_name != null ? String(r.author_name) : undefined,
    replyCount: Number(r.reply_count ?? 0),
    categoryName: String(r.category_name_ar || r.category_name || ""),
  };
}

export async function listForumReplies(threadId: string): Promise<ForumReply[]> {
  await ensureForumSchema();
  const rows = await sql`
    SELECT r.*, u.name AS author_name
    FROM "ForumReply" r
    JOIN "User" u ON u.id = r.author_id
    WHERE r.thread_id = ${threadId}
    ORDER BY r.created_at ASC
  `;
  return (rows as Record<string, unknown>[]).map((r) => ({
    ...rowToCamel<ForumReply>(r)!,
    authorName: r.author_name != null ? String(r.author_name) : undefined,
  }));
}

export async function createForumThread(data: {
  categoryId: string;
  authorId: string;
  title: string;
  body: string;
}): Promise<{ id: string }> {
  await ensureForumSchema();
  const id = generateId();
  await sql`
    INSERT INTO "ForumThread" (id, category_id, author_id, title, body)
    VALUES (${id}, ${data.categoryId}, ${data.authorId}, ${data.title.trim()}, ${data.body.trim()})
  `;
  return { id };
}

export async function createForumReply(data: {
  threadId: string;
  authorId: string;
  body: string;
}): Promise<{ id: string }> {
  await ensureForumSchema();
  const thread = await getForumThreadById(data.threadId);
  if (!thread) throw new Error("الموضوع غير موجود");
  if (thread.isLocked) throw new Error("هذا الموضوع مقفل");
  const id = generateId();
  await sql`
    INSERT INTO "ForumReply" (id, thread_id, author_id, body)
    VALUES (${id}, ${data.threadId}, ${data.authorId}, ${data.body.trim()})
  `;
  await sql`UPDATE "ForumThread" SET updated_at = NOW() WHERE id = ${data.threadId}`;
  return { id };
}

export async function setForumThreadPinned(threadId: string, pinned: boolean): Promise<void> {
  await ensureForumSchema();
  await sql`UPDATE "ForumThread" SET is_pinned = ${pinned}, updated_at = NOW() WHERE id = ${threadId}`;
}

export async function setForumThreadLocked(threadId: string, locked: boolean): Promise<void> {
  await ensureForumSchema();
  await sql`UPDATE "ForumThread" SET is_locked = ${locked}, updated_at = NOW() WHERE id = ${threadId}`;
}

export async function deleteForumThread(threadId: string): Promise<void> {
  await ensureForumSchema();
  await sql`DELETE FROM "ForumThread" WHERE id = ${threadId}`;
}

export async function deleteForumReply(replyId: string): Promise<void> {
  await ensureForumSchema();
  await sql`DELETE FROM "ForumReply" WHERE id = ${replyId}`;
}

/** اختبارات الكورسات المنشورة للصفحة العامة /exams */
export async function listPublishedExams(limit = 100): Promise<
  Array<{
    quizId: string;
    quizTitle: string;
    courseId: string;
    courseTitle: string;
    courseTitleAr: string | null;
    courseSlug: string;
    questionCount: number;
    timeLimitMinutes: number | null;
    passingScore: number | null;
    order: number;
  }>
> {
  const rows = await sql`
    SELECT
      q.id AS quiz_id,
      q.title AS quiz_title,
      q.time_limit_minutes,
      q.passing_score,
      q."order" AS quiz_order,
      c.id AS course_id,
      c.title AS course_title,
      c.title_ar AS course_title_ar,
      c.slug AS course_slug,
      (SELECT COUNT(*)::int FROM "Question" qu WHERE qu.quiz_id = q.id) AS question_count
    FROM "Quiz" q
    JOIN "Course" c ON c.id = q.course_id
    WHERE c.is_published = true
      AND (c.is_visible IS NULL OR c.is_visible = true)
    ORDER BY c."order" ASC, q."order" ASC
    LIMIT ${limit}
  `;
  return (rows as Record<string, unknown>[]).map((r) => ({
    quizId: String(r.quiz_id),
    quizTitle: String(r.quiz_title ?? ""),
    courseId: String(r.course_id),
    courseTitle: String(r.course_title ?? ""),
    courseTitleAr: r.course_title_ar != null ? String(r.course_title_ar) : null,
    courseSlug: String(r.course_slug ?? ""),
    questionCount: Number(r.question_count ?? 0),
    timeLimitMinutes: r.time_limit_minutes != null ? Number(r.time_limit_minutes) : null,
    passingScore: r.passing_score != null ? Number(r.passing_score) : null,
    order: Number(r.quiz_order ?? 0),
  }));
}
