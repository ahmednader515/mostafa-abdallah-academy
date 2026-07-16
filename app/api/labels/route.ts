import { NextResponse } from "next/server";
import { getPlatformLabelsMapCached } from "@/lib/cached-public-data";

/** خريطة المسميات العامة — متاحة للجميع لعرض المسميات المخصصة (مثال: "متدرب" بدل "طالب") */
export async function GET() {
  try {
    const labels = await getPlatformLabelsMapCached();
    return NextResponse.json(
      { labels },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json({ labels: {} });
  }
}
