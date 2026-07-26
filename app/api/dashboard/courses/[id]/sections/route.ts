import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createCourseSection,
  deleteCourseSection,
  listCourseSections,
  updateCourseSection,
} from "@/lib/course-sections-db";
import { canManageCourse } from "@/lib/permissions";
import { getCourseById } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

async function assertCanManage(sessionUserId: string, role: string, courseId: string) {
  const course = await getCourseById(courseId);
  if (!course) return { ok: false as const, status: 404, error: "الكورس غير موجود" };
  const createdBy =
    (course as { created_by_id?: string | null }).created_by_id ??
    (course as { createdById?: string | null }).createdById ??
    null;
  if (!canManageCourse(role, sessionUserId, createdBy)) {
    return { ok: false as const, status: 403, error: "غير مصرح" };
  }
  return { ok: true as const };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { id } = await params;
  const gate = await assertCanManage(session.user.id, session.user.role, id);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sections = await listCourseSections(id);
  return NextResponse.json({ sections });
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { id } = await params;
  const gate = await assertCanManage(session.user.id, session.user.role, id);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  let body: { title?: string; titleAr?: string | null; sortOrder?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "العنوان مطلوب" }, { status: 400 });
  const section = await createCourseSection({
    courseId: id,
    title,
    titleAr: body.titleAr,
    sortOrder: body.sortOrder,
  });
  return NextResponse.json({ success: true, section });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { id: courseId } = await params;
  const gate = await assertCanManage(session.user.id, session.user.role, courseId);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  let body: { sectionId?: string; title?: string; titleAr?: string | null; sortOrder?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  if (!body.sectionId) return NextResponse.json({ error: "sectionId مطلوب" }, { status: 400 });
  await updateCourseSection(body.sectionId, body);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const { id: courseId } = await params;
  const gate = await assertCanManage(session.user.id, session.user.role, courseId);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });
  const sectionId = request.nextUrl.searchParams.get("sectionId");
  if (!sectionId) return NextResponse.json({ error: "sectionId مطلوب" }, { status: 400 });
  await deleteCourseSection(sectionId);
  return NextResponse.json({ success: true });
}
