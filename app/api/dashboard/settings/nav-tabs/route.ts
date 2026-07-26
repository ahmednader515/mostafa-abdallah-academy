import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateHomepageSettings } from "@/lib/db";
import { serializeNavTabs, type NavTab } from "@/lib/nav-tabs";

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const tabs = Array.isArray(body.tabs) ? (body.tabs as NavTab[]) : [];
    await updateHomepageSettings({ nav_tabs_json: serializeNavTabs(tabs) });
    revalidateTag("homepage-settings", "max");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "فشل حفظ التبويبات" }, { status: 500 });
  }
}
