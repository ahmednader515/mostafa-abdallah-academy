import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { requireStaffPermission } from "@/lib/require-permission";
import {
  buildAnalyticsExportRows,
  resolveAnalyticsRange,
  type AnalyticsExportReport,
  type AnalyticsSource,
  type AnalyticsStatus,
} from "@/lib/analytics-db";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
  const gate = await requireStaffPermission(
    session.user.id,
    session.user.role,
    "canViewAnalytics",
  );
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }

  const sp = request.nextUrl.searchParams;
  const format = (sp.get("format") || "xlsx").toLowerCase();
  const report = (sp.get("report") || "summary") as AnalyticsExportReport;
  const range = resolveAnalyticsRange({
    preset: sp.get("preset"),
    from: sp.get("from"),
    to: sp.get("to"),
  });

  const filters = {
    ...range,
    planId: sp.get("planId") || undefined,
    courseId: sp.get("courseId") || undefined,
    categoryId: sp.get("categoryId") || undefined,
    teacherId: sp.get("teacherId") || undefined,
    userId: sp.get("userId") || undefined,
    source: (sp.get("source") as AnalyticsSource) || undefined,
    status: (sp.get("status") as AnalyticsStatus) || undefined,
    country: sp.get("country") || undefined,
  };

  const { headers, rows } = await buildAnalyticsExportRows(report, filters);
  const sheetData = [headers, ...rows];
  const filename = `analytics-${report}-${range.from.toISOString().slice(0, 10)}`;

  if (format === "csv") {
    const csv = sheetData
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell ?? "");
            if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
            return s;
          })
          .join(","),
      )
      .join("\n");
    const bom = "\uFEFF";
    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
    },
  });
}
