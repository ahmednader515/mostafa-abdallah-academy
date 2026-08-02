import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { adjustWalletBalance } from "@/lib/wallet";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "ASSISTANT_ADMIN")) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { id: studentId } = await params;
  let body: {
    amount?: number;
    reason?: string;
    direction?: "credit" | "debit";
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const amountAbs = Math.abs(Number(body.amount));
  if (Number.isNaN(amountAbs) || amountAbs <= 0) {
    return NextResponse.json({ error: "المبلغ غير صالح" }, { status: 400 });
  }

  const reason = String(body.reason ?? "").trim();
  if (!reason) {
    return NextResponse.json({ error: "سبب العملية مطلوب" }, { status: 400 });
  }

  const direction =
    body.direction === "debit" || Number(body.amount) < 0 ? "debit" : "credit";
  const signed = direction === "debit" ? -amountAbs : amountAbs;

  const student = await getUserById(studentId);
  if (!student || student.role !== "STUDENT") {
    return NextResponse.json({ error: "الطالب غير موجود" }, { status: 404 });
  }

  try {
    const result = await adjustWalletBalance({
      userId: studentId,
      amount: signed,
      type: direction === "credit" ? "topup" : "debit",
      reason,
      referenceType: "admin_adjustment",
      referenceId: session.user.id,
      createdBy: session.user.id,
    });
    return NextResponse.json({
      success: true,
      balance: result.balanceAfter,
      transactionId: result.transactionId,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "تعذر تحديث الرصيد";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
