import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStoreSalesStats, listStorePurchasesForAdmin } from "@/lib/db";
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
    const [purchases, stats] = await Promise.all([
      listStorePurchasesForAdmin(),
      getStoreSalesStats(),
    ]);
    return NextResponse.json({ purchases, stats });
  } catch {
    return NextResponse.json({ error: "فشل جلب بيانات المبيعات" }, { status: 500 });
  }
}
