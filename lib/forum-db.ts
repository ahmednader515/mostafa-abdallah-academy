/**
 * منتدى المنصة — أقسام، مواضيع، ردود (server-only DB layer)
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import type { UserRole } from "@/lib/types";
import {
  FORUM_AUDIENCES,
  FORUM_CATEGORY_ICONS,
  type ForumAudience,
  type ForumCategory,
  type ForumReply,
  type ForumThread,
  type ForumThreadSort,
  userCanCreateInCategory,
  userCanViewCategory,
} from "@/lib/forum-shared";

export type {
  ForumAudience,
  ForumCategory,
  ForumCategoryIconKey,
  ForumReply,
  ForumThread,
  ForumThreadSort,
} from "@/lib/forum-shared";
export {
  FORUM_AUDIENCES,
  FORUM_CATEGORY_ICONS,
  userCanCreateInCategory,
  userCanViewCategory,
  userMatchesAudience,
} from "@/lib/forum-shared";

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

function normalizeAudience(raw: unknown, fallback: ForumAudience = "public"): ForumAudience {
  const v = String(raw ?? "").trim();
  return (FORUM_AUDIENCES as string[]).includes(v) ? (v as ForumAudience) : fallback;
}

function normalizeIcon(raw: unknown): string {
  const v = String(raw ?? "chat").trim();
  return (FORUM_CATEGORY_ICONS as readonly string[]).includes(v) ? v : "chat";
}

function normalizeColor(raw: unknown): string {
  const v = String(raw ?? "#0056D2").trim();
  return /^#[0-9A-Fa-f]{6}$/.test(v) ? v : "#0056D2";
}

function mapCategory(row: Record<string, unknown>): ForumCategory {
  const base = rowToCamel<ForumCategory>(row)!;
  return {
    ...base,
    descriptionAr: row.description_ar != null ? String(row.description_ar) : base.descriptionAr ?? null,
    icon: normalizeIcon(row.icon ?? base.icon),
    color: normalizeColor(row.color ?? base.color),
    isLocked: Boolean(row.is_locked ?? base.isLocked ?? false),
    isPinned: Boolean(row.is_pinned ?? base.isPinned ?? false),
    isDefault: Boolean(row.is_default ?? base.isDefault ?? false),
    viewAudience: normalizeAudience(row.view_audience ?? base.viewAudience, "public"),
    createAudience: normalizeAudience(row.create_audience ?? base.createAudience, "logged_in"),
    threadCount: row.thread_count != null ? Number(row.thread_count) : base.threadCount,
  };
}

async function alterForumThreadFkToRestrict(): Promise<void> {
  try {
    await sql`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN
          SELECT c.conname
          FROM pg_constraint c
          JOIN pg_class t ON c.conrelid = t.oid
          WHERE t.relname = 'ForumThread'
            AND c.contype = 'f'
            AND pg_get_constraintdef(c.oid) LIKE '%category_id%'
        LOOP
          EXECUTE format('ALTER TABLE "ForumThread" DROP CONSTRAINT IF EXISTS %I', r.conname);
        END LOOP;
        BEGIN
          ALTER TABLE "ForumThread"
            ADD CONSTRAINT "ForumThread_category_id_fkey"
            FOREIGN KEY (category_id) REFERENCES "ForumCategory"(id) ON DELETE RESTRICT;
        EXCEPTION WHEN duplicate_object THEN
          NULL;
        END;
      END $$;
    `;
  } catch {
    /* ignore migration failures on unsupported environments */
  }
}

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

    await sql`ALTER TABLE "ForumCategory" ADD COLUMN IF NOT EXISTS description_ar TEXT`;
    await sql`ALTER TABLE "ForumCategory" ADD COLUMN IF NOT EXISTS icon TEXT NOT NULL DEFAULT 'chat'`;
    await sql`ALTER TABLE "ForumCategory" ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT '#0056D2'`;
    await sql`ALTER TABLE "ForumCategory" ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false`;
    await sql`ALTER TABLE "ForumCategory" ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false`;
    await sql`ALTER TABLE "ForumCategory" ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false`;
    await sql`ALTER TABLE "ForumCategory" ADD COLUMN IF NOT EXISTS view_audience TEXT NOT NULL DEFAULT 'public'`;
    await sql`ALTER TABLE "ForumCategory" ADD COLUMN IF NOT EXISTS create_audience TEXT NOT NULL DEFAULT 'logged_in'`;

    await sql`
      CREATE TABLE IF NOT EXISTS "ForumThread" (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL REFERENCES "ForumCategory"(id) ON DELETE RESTRICT,
        author_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        is_locked BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await alterForumThreadFkToRestrict();

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
        {
          name: "General",
          name_ar: "عام",
          description: "General platform discussions",
          description_ar: "نقاشات عامة عن المنصة",
          order: 0,
          icon: "chat",
          is_default: true,
        },
        {
          name: "Courses Q&A",
          name_ar: "أسئلة الكورسات",
          description: "Ask about course content and lectures",
          description_ar: "اسأل عن محتوى الكورسات والمحاضرات",
          order: 1,
          icon: "book",
          is_default: false,
        },
        {
          name: "Announcements",
          name_ar: "الإعلانات",
          description: "Team announcements and updates",
          description_ar: "إعلانات الفريق والتحديثات",
          order: 2,
          icon: "mic",
          is_default: false,
        },
      ];
      for (const d of defaults) {
        await sql`
          INSERT INTO "ForumCategory" (
            id, name, name_ar, description, description_ar, "order", is_visible,
            icon, color, is_locked, is_pinned, is_default, view_audience, create_audience
          )
          VALUES (
            ${generateId()}, ${d.name}, ${d.name_ar}, ${d.description}, ${d.description_ar},
            ${d.order}, true, ${d.icon}, ${"#0056D2"}, false, false, ${d.is_default},
            ${"public"}, ${"logged_in"}
          )
        `;
      }
    }
  });
}

export async function listForumCategories(
  visibleOnly = true,
  opts?: { withThreadCount?: boolean },
): Promise<ForumCategory[]> {
  await ensureForumSchema();
  const withCount = opts?.withThreadCount ?? false;
  const rows = visibleOnly
    ? withCount
      ? await sql`
          SELECT c.*,
            (SELECT COUNT(*)::int FROM "ForumThread" t WHERE t.category_id = c.id) AS thread_count
          FROM "ForumCategory" c
          WHERE c.is_visible = true
          ORDER BY c.is_pinned DESC, c."order" ASC
        `
      : await sql`
          SELECT * FROM "ForumCategory"
          WHERE is_visible = true
          ORDER BY is_pinned DESC, "order" ASC
        `
    : withCount
      ? await sql`
          SELECT c.*,
            (SELECT COUNT(*)::int FROM "ForumThread" t WHERE t.category_id = c.id) AS thread_count
          FROM "ForumCategory" c
          ORDER BY c.is_pinned DESC, c."order" ASC
        `
      : await sql`
          SELECT * FROM "ForumCategory"
          ORDER BY is_pinned DESC, "order" ASC
        `;
  return (rows as Record<string, unknown>[]).map(mapCategory);
}

export async function listForumCategoriesForUser(
  role: UserRole | string | null | undefined,
  isLoggedIn: boolean,
  opts?: { forCreate?: boolean; withThreadCount?: boolean },
): Promise<ForumCategory[]> {
  const all = await listForumCategories(false, { withThreadCount: opts?.withThreadCount });
  return all.filter((c) =>
    opts?.forCreate
      ? userCanCreateInCategory(c, role, isLoggedIn)
      : userCanViewCategory(c, role, isLoggedIn),
  );
}

export async function getForumCategoryById(id: string): Promise<ForumCategory | null> {
  await ensureForumSchema();
  const rows = await sql`
    SELECT c.*,
      (SELECT COUNT(*)::int FROM "ForumThread" t WHERE t.category_id = c.id) AS thread_count
    FROM "ForumCategory" c
    WHERE c.id = ${id}
    LIMIT 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  return row ? mapCategory(row) : null;
}

export async function getDefaultForumCategory(): Promise<ForumCategory | null> {
  await ensureForumSchema();
  const rows = await sql`
    SELECT * FROM "ForumCategory"
    WHERE is_default = true AND is_visible = true
    ORDER BY "order" ASC
    LIMIT 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (row) return mapCategory(row);
  const fallback = await sql`
    SELECT * FROM "ForumCategory"
    WHERE is_visible = true
    ORDER BY is_pinned DESC, "order" ASC
    LIMIT 1
  `;
  const f = fallback[0] as Record<string, unknown> | undefined;
  return f ? mapCategory(f) : null;
}

export async function createForumCategory(data: {
  name: string;
  nameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  icon?: string;
  color?: string;
  isVisible?: boolean;
  isLocked?: boolean;
  isPinned?: boolean;
  isDefault?: boolean;
  viewAudience?: ForumAudience;
  createAudience?: ForumAudience;
}): Promise<ForumCategory> {
  await ensureForumSchema();
  const id = generateId();
  const max = await sql`SELECT COALESCE(MAX("order"), -1)::int AS m FROM "ForumCategory"`;
  const order = Number((max[0] as { m?: number })?.m ?? -1) + 1;
  const isDefault = Boolean(data.isDefault);
  if (isDefault) {
    await sql`UPDATE "ForumCategory" SET is_default = false WHERE is_default = true`;
  }
  await sql`
    INSERT INTO "ForumCategory" (
      id, name, name_ar, description, description_ar, "order", is_visible,
      icon, color, is_locked, is_pinned, is_default, view_audience, create_audience
    )
    VALUES (
      ${id},
      ${data.name.trim()},
      ${data.nameAr?.trim() || null},
      ${data.description?.trim() || null},
      ${data.descriptionAr?.trim() || null},
      ${order},
      ${data.isVisible !== false},
      ${normalizeIcon(data.icon)},
      ${normalizeColor(data.color)},
      ${Boolean(data.isLocked)},
      ${Boolean(data.isPinned)},
      ${isDefault},
      ${normalizeAudience(data.viewAudience, "public")},
      ${normalizeAudience(data.createAudience, "logged_in")}
    )
  `;
  const created = await getForumCategoryById(id);
  if (!created) throw new Error("Failed to create category");
  return created;
}

export async function updateForumCategory(
  id: string,
  data: Partial<{
    name: string;
    nameAr: string | null;
    description: string | null;
    descriptionAr: string | null;
    icon: string;
    color: string;
    isVisible: boolean;
    isLocked: boolean;
    isPinned: boolean;
    isDefault: boolean;
    viewAudience: ForumAudience;
    createAudience: ForumAudience;
  }>,
): Promise<ForumCategory | null> {
  await ensureForumSchema();
  const existing = await getForumCategoryById(id);
  if (!existing) return null;

  if (data.isDefault === true) {
    await sql`UPDATE "ForumCategory" SET is_default = false WHERE is_default = true AND id <> ${id}`;
  }

  const name = data.name !== undefined ? data.name.trim() : existing.name;
  const nameAr = data.nameAr !== undefined ? data.nameAr?.trim() || null : existing.nameAr;
  const description =
    data.description !== undefined ? data.description?.trim() || null : existing.description;
  const descriptionAr =
    data.descriptionAr !== undefined
      ? data.descriptionAr?.trim() || null
      : existing.descriptionAr;
  const icon = data.icon !== undefined ? normalizeIcon(data.icon) : existing.icon;
  const color = data.color !== undefined ? normalizeColor(data.color) : existing.color;
  const isVisible = data.isVisible !== undefined ? Boolean(data.isVisible) : existing.isVisible;
  const isLocked = data.isLocked !== undefined ? Boolean(data.isLocked) : existing.isLocked;
  const isPinned = data.isPinned !== undefined ? Boolean(data.isPinned) : existing.isPinned;
  const isDefault = data.isDefault !== undefined ? Boolean(data.isDefault) : existing.isDefault;
  const viewAudience =
    data.viewAudience !== undefined
      ? normalizeAudience(data.viewAudience)
      : existing.viewAudience;
  const createAudience =
    data.createAudience !== undefined
      ? normalizeAudience(data.createAudience)
      : existing.createAudience;

  await sql`
    UPDATE "ForumCategory"
    SET
      name = ${name},
      name_ar = ${nameAr},
      description = ${description},
      description_ar = ${descriptionAr},
      icon = ${icon},
      color = ${color},
      is_visible = ${isVisible},
      is_locked = ${isLocked},
      is_pinned = ${isPinned},
      is_default = ${isDefault},
      view_audience = ${viewAudience},
      create_audience = ${createAudience}
    WHERE id = ${id}
  `;
  return getForumCategoryById(id);
}

export async function countThreadsInCategory(categoryId: string): Promise<number> {
  await ensureForumSchema();
  const rows = await sql`
    SELECT COUNT(*)::int AS c FROM "ForumThread" WHERE category_id = ${categoryId}
  `;
  return Number((rows[0] as { c?: number })?.c ?? 0);
}

export async function moveThreadsToCategory(
  fromCategoryId: string,
  toCategoryId: string,
): Promise<number> {
  await ensureForumSchema();
  if (fromCategoryId === toCategoryId) return 0;
  const target = await getForumCategoryById(toCategoryId);
  if (!target) throw new Error("Target category not found");
  const rows = await sql`
    UPDATE "ForumThread"
    SET category_id = ${toCategoryId}, updated_at = NOW()
    WHERE category_id = ${fromCategoryId}
  `;
  return Array.isArray(rows) ? rows.length : 0;
}

export async function deleteForumCategory(
  id: string,
  opts: { mode: "block" | "move"; moveToCategoryId?: string | null },
): Promise<{ deleted: boolean; reason?: string }> {
  await ensureForumSchema();
  const cat = await getForumCategoryById(id);
  if (!cat) return { deleted: false, reason: "not_found" };

  const count = await countThreadsInCategory(id);
  if (count > 0) {
    if (opts.mode === "block") {
      return { deleted: false, reason: "has_threads" };
    }
    const moveTo = opts.moveToCategoryId?.trim();
    if (!moveTo || moveTo === id) {
      return { deleted: false, reason: "move_target_required" };
    }
    await moveThreadsToCategory(id, moveTo);
  }

  await sql`DELETE FROM "ForumCategory" WHERE id = ${id}`;
  return { deleted: true };
}

export async function reorderForumCategories(orderedIds: string[]): Promise<void> {
  await ensureForumSchema();
  for (let i = 0; i < orderedIds.length; i++) {
    await sql`UPDATE "ForumCategory" SET "order" = ${i} WHERE id = ${orderedIds[i]}`;
  }
}

function mapThread(r: Record<string, unknown>): ForumThread {
  const base = rowToCamel<ForumThread>(r)!;
  return {
    ...base,
    authorName: r.author_name != null ? String(r.author_name) : undefined,
    replyCount: Number(r.reply_count ?? 0),
    lastReplyAt: r.last_reply_at ? new Date(String(r.last_reply_at)) : null,
    categoryName: String(r.category_name_ar || r.category_name || ""),
    categoryIcon: normalizeIcon(r.category_icon),
    categoryColor: normalizeColor(r.category_color),
  };
}

export async function listForumThreads(
  categoryId?: string | null,
  limit = 50,
  opts?: {
    sort?: ForumThreadSort;
    query?: string;
    allowedCategoryIds?: string[] | null;
  },
): Promise<ForumThread[]> {
  await ensureForumSchema();
  const sort = opts?.sort ?? "newest";
  const q = opts?.query?.trim().toLowerCase() ?? "";
  const allowed = opts?.allowedCategoryIds;

  let rows: Record<string, unknown>[];
  if (categoryId) {
    rows = (await sql`
      SELECT t.*, u.name AS author_name,
        (SELECT COUNT(*)::int FROM "ForumReply" r WHERE r.thread_id = t.id) AS reply_count,
        (SELECT MAX(r.created_at) FROM "ForumReply" r WHERE r.thread_id = t.id) AS last_reply_at,
        c.name AS category_name, c.name_ar AS category_name_ar,
        c.icon AS category_icon, c.color AS category_color
      FROM "ForumThread" t
      JOIN "User" u ON u.id = t.author_id
      JOIN "ForumCategory" c ON c.id = t.category_id
      WHERE t.category_id = ${categoryId}
      ORDER BY t.is_pinned DESC, t.created_at DESC
      LIMIT ${Math.max(limit * 3, 200)}
    `) as Record<string, unknown>[];
  } else {
    rows = (await sql`
      SELECT t.*, u.name AS author_name,
        (SELECT COUNT(*)::int FROM "ForumReply" r WHERE r.thread_id = t.id) AS reply_count,
        (SELECT MAX(r.created_at) FROM "ForumReply" r WHERE r.thread_id = t.id) AS last_reply_at,
        c.name AS category_name, c.name_ar AS category_name_ar,
        c.icon AS category_icon, c.color AS category_color
      FROM "ForumThread" t
      JOIN "User" u ON u.id = t.author_id
      JOIN "ForumCategory" c ON c.id = t.category_id
      WHERE c.is_visible = true
      ORDER BY t.is_pinned DESC, t.created_at DESC
      LIMIT ${Math.max(limit * 3, 200)}
    `) as Record<string, unknown>[];
  }

  let threads = rows.map(mapThread);

  if (allowed && allowed.length >= 0) {
    const set = new Set(allowed);
    threads = threads.filter((t) => set.has(t.categoryId));
  }

  if (q) {
    threads = threads.filter((t) => {
      const hay = `${t.title} ${t.body} ${t.authorName ?? ""} ${t.categoryName ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  threads.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (sort === "oldest") {
      return +new Date(a.createdAt) - +new Date(b.createdAt);
    }
    if (sort === "replies") {
      return (b.replyCount ?? 0) - (a.replyCount ?? 0) || +new Date(b.createdAt) - +new Date(a.createdAt);
    }
    const aAct = +(a.lastReplyAt || a.createdAt);
    const bAct = +(b.lastReplyAt || b.createdAt);
    return bAct - aAct;
  });

  return threads.slice(0, limit);
}

export async function getForumThreadById(id: string): Promise<ForumThread | null> {
  await ensureForumSchema();
  const rows = await sql`
    SELECT t.*, u.name AS author_name,
      (SELECT COUNT(*)::int FROM "ForumReply" r WHERE r.thread_id = t.id) AS reply_count,
      c.name AS category_name, c.name_ar AS category_name_ar,
      c.icon AS category_icon, c.color AS category_color
    FROM "ForumThread" t
    JOIN "User" u ON u.id = t.author_id
    JOIN "ForumCategory" c ON c.id = t.category_id
    WHERE t.id = ${id}
    LIMIT 1
  `;
  const r = rows[0] as Record<string, unknown> | undefined;
  if (!r) return null;
  return mapThread(r);
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
