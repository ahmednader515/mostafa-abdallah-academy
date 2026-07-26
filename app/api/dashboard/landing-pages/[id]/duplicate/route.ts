import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { duplicateLandingPage } from "@/lib/landing-pages-db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    const page = await duplicateLandingPage(id);
    return NextResponse.json({ page });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "فشل النسخ";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
