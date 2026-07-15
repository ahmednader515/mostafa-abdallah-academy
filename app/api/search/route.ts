import { NextRequest, NextResponse } from "next/server";
import { searchPlatform } from "@/lib/db";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ results: [] });
  }
  try {
    const results = await searchPlatform(q);
    return NextResponse.json({ results, q });
  } catch {
    return NextResponse.json({ error: "فشل البحث" }, { status: 500 });
  }
}
