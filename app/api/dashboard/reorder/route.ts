import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageCourse } from "@/lib/permissions";
import {
  categoryIsManageableOnDashboard,
  getCourseById,
  updateCategoryOrder,
  updateCourseOrder,
  updateJobOrder,
  updateLibraryCategoryOrder,
  updateLibraryItemOrder,
} from "@/lib/db";

type ReorderEntity = "category" | "course" | "libraryCategory" | "libraryItem" | "job";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  let body: { entity?: ReorderEntity; orderedIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const entity = body.entity;
  const orderedIds = Array.isArray(body.orderedIds)
    ? body.orderedIds.map((id) => String(id).trim()).filter(Boolean)
    : [];

  if (!entity || orderedIds.length === 0) {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const role = session.user.role;
  const userId = session.user.id;

  try {
    if (entity === "category") {
      if (role !== "ADMIN" && role !== "ASSISTANT_ADMIN" && role !== "TEACHER") {
        return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
      }
      for (const id of orderedIds) {
        const ok = await categoryIsManageableOnDashboard(id, userId, role);
        if (!ok) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
      }
      await updateCategoryOrder(orderedIds);
    } else if (entity === "course") {
      for (const id of orderedIds) {
        const course = await getCourseById(id);
        if (!course) return NextResponse.json({ error: "كورس غير موجود" }, { status: 404 });
        const createdBy =
          (course as { createdById?: string | null }).createdById ??
          (course as { created_by_id?: string | null }).created_by_id ??
          null;
        if (!canManageCourse(role, userId, createdBy)) {
          return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
        }
      }
      await updateCourseOrder(orderedIds);
    } else if (entity === "libraryCategory" || entity === "libraryItem") {
      if (role !== "ADMIN") {
        return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
      }
      if (entity === "libraryCategory") await updateLibraryCategoryOrder(orderedIds);
      else await updateLibraryItemOrder(orderedIds);
    } else if (entity === "job") {
      if (role !== "ADMIN") {
        return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
      }
      await updateJobOrder(orderedIds);
    } else {
      return NextResponse.json({ error: "نوع غير مدعوم" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل إعادة الترتيب" }, { status: 500 });
  }
}
