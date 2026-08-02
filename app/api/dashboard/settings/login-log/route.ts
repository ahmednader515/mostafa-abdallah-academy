import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { countUserLoginLogs, listUserLoginLogs } from "@/lib/admin-security-db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const params = {
    search: sp.get("search") ?? undefined,
    userId: sp.get("userId") ?? undefined,
    status: (sp.get("status") as "success" | "failed" | "all" | null) ?? "all",
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    limit: Math.min(200, Math.max(1, Number(sp.get("limit") ?? 50))),
    offset: Math.max(0, Number(sp.get("offset") ?? 0)),
  };

  const [logs, total] = await Promise.all([
    listUserLoginLogs(params),
    countUserLoginLogs(params),
  ]);

  return NextResponse.json({ logs, total, limit: params.limit, offset: params.offset });
}
