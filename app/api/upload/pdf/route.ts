import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToR2, isR2Configured, getMissingR2EnvVars } from "@/lib/r2";

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "mp4",
  "webm",
  "mov",
]);

function sanitizeExt(name: string): string {
  const raw = name.split(".").pop()?.toLowerCase() ?? "";
  const ext = raw.replace(/[^a-z0-9]+/g, "").slice(0, 10);
  return ext || "bin";
}

function inferFileType(ext: string): string {
  if (ext === "mp4" || ext === "webm" || ext === "mov") return "video";
  if (ALLOWED_EXTENSIONS.has(ext)) return ext;
  return "other";
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = session?.user.role;
  const canUpload =
    role === "ADMIN" || role === "ASSISTANT_ADMIN" || role === "TEACHER";
  if (!session || !canUpload) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  if (!isR2Configured()) {
    const missing = getMissingR2EnvVars().filter((m) => !m.startsWith("R2_PUBLIC"));
    return NextResponse.json(
      {
        error: "التخزين R2 غير مضبوط.",
        missing: missing.length ? missing : ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"],
      },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "لم يُرفع أي ملف" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "حجم الملف أكبر من 50 ميجابايت" },
      { status: 400 }
    );
  }

  const ext = sanitizeExt(file.name || "");
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: "نوع الملف غير مدعوم. الأنواع المسموحة: PDF, Word, Excel, PowerPoint, فيديو (mp4/webm/mov)" },
      { status: 400 }
    );
  }

  const fileType = inferFileType(ext);
  const key = `lesson-files/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = (file.type && file.type.trim()) ? file.type : "application/octet-stream";
    const { url: uploadedUrl } = await uploadToR2(buffer, key, contentType);

    const baseUrl = (uploadedUrl ? null : process.env.R2_PUBLIC_URL?.trim()?.replace(/\/$/, "")) || null;
    const url = uploadedUrl || (baseUrl ? `${baseUrl}/${key}` : null);

    if (!url) {
      return NextResponse.json({
        error: "تم الرفع لكن R2_PUBLIC_URL غير مضبوط.",
        key,
        fileType,
      }, { status: 200 });
    }

    return NextResponse.json({ url, key, fileType });
  } catch (e) {
    console.error("R2 file upload error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "فشل رفع الملف" },
      { status: 500 }
    );
  }
}
