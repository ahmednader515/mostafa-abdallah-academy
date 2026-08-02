import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteStorePurchaseById } from "@/lib/db";
import { permissionDeniedResponse } from "@/lib/require-permission";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  const denied = await permissionDeniedResponse(
    session.user.id,
    session.user.role,
    "canManageLibrary",
  );
  if (denied) return denied;
  const { id } = await params;
  if (!id?.trim()) return NextResponse.json({ error: "معرف الشراء غير صالح" }, { status: 400 });

  try {
    await deleteStorePurchaseById(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل حذف الشراء" }, { status: 500 });
  }
}
