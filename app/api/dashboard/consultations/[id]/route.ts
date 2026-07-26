import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteConsultation, updateConsultation } from "@/lib/lms-features-db";
async function staff() { const s = await getServerSession(authOptions); return s?.user.role === "ADMIN" || s?.user.role === "ASSISTANT_ADMIN"; }
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) { if (!(await staff())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 }); const body = await request.json(); await updateConsultation((await params).id, { ...body, price: body.price === undefined ? undefined : Number(body.price) || 0 }); return NextResponse.json({ success: true }); }
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) { if (!(await staff())) return NextResponse.json({ error: "غير مصرح" }, { status: 403 }); await deleteConsultation((await params).id); return NextResponse.json({ success: true }); }
