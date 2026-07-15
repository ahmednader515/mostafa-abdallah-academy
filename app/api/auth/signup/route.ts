import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { getUserByEmail, createUser } from "@/lib/db";
import { validatePhoneForCountry } from "@/lib/phone/countries";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل"),
  name: z.string().min(2, "الاسم حرفين على الأقل"),
  phone_country: z.string().min(2, "كود الدولة مطلوب"),
  phone_national: z.string().min(1, "رقم الهاتف مطلوب"),
  student_number: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
        { status: 400 },
      );
    }
    const { email, password, name, phone_country, phone_national, student_number } = parsed.data;

    const phoneCheck = validatePhoneForCountry(phone_country, phone_national);
    if (!phoneCheck.ok) {
      return NextResponse.json({ error: phoneCheck.messageAr }, { status: 400 });
    }
    if (student_number && student_number.replace(/\D/g, "") !== phoneCheck.stored) {
      return NextResponse.json({ error: "رقم الهاتف غير متطابق" }, { status: 400 });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مستخدم مسبقاً" },
        { status: 400 },
      );
    }

    const passwordHash = await hash(password, 12);
    await createUser({
      email,
      password_hash: passwordHash,
      name,
      role: "STUDENT",
      student_number: phoneCheck.stored,
      guardian_number: null,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Signup error:", e);
    const message = e instanceof Error ? e.message : String(e);
    const isVercel = !!process.env.VERCEL;
    let userMessage = "حدث خطأ أثناء إنشاء الحساب.";
    if (message.includes("DATABASE_URL") || message.includes("Environment variable not found")) {
      userMessage = isVercel
        ? "قاعدة البيانات غير مضبوطة على السيرفر. في Vercel: Settings → Environment Variables → أضف DATABASE_URL (رابط Neon أو Supabase) ثم أعد النشر. للتحقق: افتح /api/health"
        : "لم يتم ضبط قاعدة البيانات. أنشئ ملف .env وأضف DATABASE_URL ثم نفّذ: npm run db:push";
    } else if (
      message.includes("does not exist") ||
      message.includes("Unknown table") ||
      message.includes("relation") ||
      message.includes("P1001") ||
      message.includes("P2021") ||
      message.includes("Can't reach")
    ) {
      userMessage = isVercel
        ? "الاتصال بقاعدة البيانات فشل. تأكد أن DATABASE_URL على Vercel يشير إلى قاعدة سحابية (Neon/Supabase) وليس localhost، ثم أعد النشر. للتحقق: افتح /api/health"
        : "جدول المستخدمين غير موجود أو قاعدة البيانات غير متصلة. افتح لوحة Neon → SQL Editor، انسخ محتوى ملف scripts/init-neon-database.sql ونفّذه مرة واحدة لإنشاء الجداول.";
    } else if (process.env.NODE_ENV === "development" && message) {
      userMessage = message;
    }
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
