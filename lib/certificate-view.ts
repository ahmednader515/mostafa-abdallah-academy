import type { Certificate } from "@/lib/types";
import {
  getCertificateTemplate,
  getDefaultCertificateTemplate,
  templateFromSnapshot,
  type CertificateTemplate,
} from "@/lib/certificate-templates-db";

export function publicCertificatePath(certificateId: string): string {
  return `/certificate/${encodeURIComponent(certificateId)}`;
}

export async function resolveTemplateForCertificate(
  certificate: Certificate
): Promise<CertificateTemplate> {
  const snapshot =
    certificate.templateSnapshotJson ??
    (certificate as { template_snapshot_json?: string | null }).template_snapshot_json;
  const fromSnap = templateFromSnapshot(snapshot ?? null);
  if (fromSnap) return fromSnap;

  const tid =
    certificate.templateId ??
    (certificate as { template_id?: string | null }).template_id;
  if (tid) {
    const t = await getCertificateTemplate(String(tid));
    if (t) return t;
  }
  return getDefaultCertificateTemplate();
}
