import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCategories, createCategory } from "@/lib/db";
import { updateCategoryFields } from "@/lib/lms-spec-db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json({ error: "فشل جلب الأقسام" }, { status: 500 });
  }
}

function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return base || `cat-${Date.now().toString(36)}`;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  let body: {
    name?: string;
    nameAr?: string | null;
    slug?: string;
    description?: string | null;
    imageUrl?: string | null;
    order?: number;
    parentId?: string | null;
    isVisible?: boolean;
    isPinned?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const name = body.name?.trim() || body.nameAr?.trim();
  if (!name) {
    return NextResponse.json({ error: "اسم القسم مطلوب" }, { status: 400 });
  }
  try {
    const category = await createCategory({
      name,
      name_ar: body.nameAr?.trim() || null,
      slug: body.slug?.trim() || slugify(name),
      description: body.description ?? null,
      image_url: body.imageUrl ?? null,
      order: body.order,
      created_by_id: session.user.id,
    });
    if (body.parentId !== undefined || body.isVisible !== undefined || body.isPinned !== undefined) {
      await updateCategoryFields(category.id, {
        parentId: body.parentId,
        isVisible: body.isVisible,
        isPinned: body.isPinned,
      });
    }
    return NextResponse.json({ success: true, id: category.id });
  } catch {
    return NextResponse.json({ error: "فشل إنشاء القسم" }, { status: 500 });
  }
}
