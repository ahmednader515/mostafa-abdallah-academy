import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCertificateById, getCertificateByPublicId } from "@/lib/lms-spec-db";
import { publicCertificatePath } from "@/lib/certificate-view";

/**
 * المسار القديم `/certificates/{id}` — إن كان المعرّف داخلياً أو CERT-…
 * يُحوَّل إلى الصفحة العامة `/certificate/CERT-…` بعد التحقق من الصلاحية للمالك/الموظف
 * (الشهادة العامة متاحة أيضاً عبر الرابط المباشر).
 */
export default async function CertificateLegacyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  let certificate =
    (await getCertificateById(id).catch(() => null)) ||
    (id.toUpperCase().startsWith("CERT-")
      ? await getCertificateByPublicId(id).catch(() => null)
      : null);

  if (!certificate) notFound();

  // الصفحة العامة مفتوحة للجميع — نعيد التوجيه دائماً للرابط العام
  // مع الإبقاء على حماية اختيارية: الزائر غير المصرح يرى الصفحة العامة أيضاً (مشاركة)
  void session;
  redirect(publicCertificatePath(certificate.certificateId));
}
