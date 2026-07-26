import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchStudentAccount } from "@/lib/student-dashboard";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const q = request.nextUrl.searchParams.get("q") || "";
  const result = await searchStudentAccount(session.user.id, q);
  return NextResponse.json(result);
}
