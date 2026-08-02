import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createLibraryCategory, listLibraryCategoriesAll } from "@/lib/db";
import { permissionDeniedResponse } from "@/lib/require-permission";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const denied = await permissionDeniedResponse(
    session.user.id,
    session.user.role,
    "canManageLibrary",
  );
  if (denied) return denied;
  try {
    const categories = await listLibraryCategoriesAll();
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ error: "فشل جلب تصنيفات المكتبة" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const denied = await permissionDeniedResponse(
    session.user.id,
    session.user.role,
    "canManageLibrary",
  );
  if (denied) return denied;
  let body: {
    name?: string;
    nameAr?: string | null;
    slug?: string;
    parentId?: string | null;
    order?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const name = String(body.name ?? "").trim();
  const slug = String(body.slug ?? "").trim();
  if (!name) return NextResponse.json({ error: "اسم التصنيف مطلوب" }, { status: 400 });
  if (!slug) return NextResponse.json({ error: "الرابط المختصر مطلوب" }, { status: 400 });
  try {
    const out = await createLibraryCategory({
      name,
      name_ar: body.nameAr ?? null,
      slug,
      parent_id: body.parentId ?? null,
      order: body.order,
    });
    return NextResponse.json({ success: true, id: out.id });
  } catch {
    return NextResponse.json({ error: "فشل إنشاء التصنيف" }, { status: 500 });
  }
}
