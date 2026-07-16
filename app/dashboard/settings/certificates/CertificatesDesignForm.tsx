"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CertificateDocument } from "@/components/CertificateDocument";
import { useLocale, useT } from "@/components/LocaleProvider";
import type { CertificateDesignSettings } from "@/lib/lms-spec-db";

type IssuedCertificate = {
  id: string;
  certificateId: string;
  studentName: string;
  courseTitle: string;
  score: number | null;
  issuedAt: string | Date;
};

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-foreground)]">{label}</label>
      <div className="mt-1 flex items-center gap-3">
        <input
          type="color"
          value={/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : "#2563eb"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 cursor-pointer rounded border border-[var(--color-border)] bg-transparent p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#2563EB"
          className="min-w-[140px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
        />
      </div>
    </div>
  );
}

function ImageUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const t = useT();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function uploadFile(file: File) {
    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) onChange(String(data.url));
      else setUploadError(data.error || t("dashboard.certificatesDesign.uploadFailed", "Upload failed"));
    } catch {
      setUploadError(t("dashboard.certificatesDesign.uploadConnectionFailed", "Connection failed during upload"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-foreground)]">{label}</label>
      {value ? (
        <div className="mt-2 flex flex-wrap items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="h-16 w-auto max-w-[200px] rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] object-contain p-1"
          />
          <button type="button" onClick={() => onChange("")} className="text-sm text-red-600 hover:underline">
            {t("dashboard.certificatesDesign.removeImage", "Remove")}
          </button>
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--color-border)]/50">
          {uploading
            ? t("dashboard.certificatesDesign.uploading", "Uploading…")
            : t("dashboard.certificatesDesign.chooseImage", "Upload image")}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadFile(file);
              e.target.value = "";
            }}
          />
        </label>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="min-w-[200px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />
      </div>
      {uploadError ? <p className="mt-1 text-sm text-red-600">{uploadError}</p> : null}
    </div>
  );
}

export function CertificatesDesignForm({
  initialDesign,
  initialCertificates,
  academyName,
  canDelete,
}: {
  initialDesign: CertificateDesignSettings;
  initialCertificates: IssuedCertificate[];
  academyName: string;
  canDelete: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [form, setForm] = useState(initialDesign);
  const [certificates, setCertificates] = useState(initialCertificates);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const previewLabels = useMemo(() => {
    const isEn = locale === "en";
    return {
      eyebrow:
        (isEn ? form.eyebrowEn : form.eyebrowAr)?.trim() ||
        t("certificates.certOfCompletion", "Certificate of completion"),
      title:
        (isEn ? form.titleEn : form.titleAr)?.trim() ||
        t("certificates.certTitle", "Certificate of Achievement"),
      awardedTo: t("certificates.awardedTo", "This certificate is awarded to"),
      completionText: t("certificates.completionText", "for successfully completing the requirements of the course"),
      withScore: t("certificates.withScore", "with a score of"),
      issuedOn: t("certificates.issuedOn", "Issued on"),
      certificateIdLabel: t("certificates.certificateId", "Certificate ID"),
    };
  }, [form.eyebrowAr, form.eyebrowEn, form.titleAr, form.titleEn, locale, t]);

  const signatureLabel =
    (locale === "en" ? form.signatureLabelEn : form.signatureLabelAr)?.trim() || null;

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/settings/certificates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t("dashboard.certificatesDesign.saveFailed", "Failed to save"));
        return;
      }
      if (data.design) setForm(data.design);
      setSuccess(t("dashboard.certificatesDesign.saveSuccess", "Certificate design saved"));
      router.refresh();
    } catch {
      setError(t("dashboard.certificatesDesign.connectionFailed", "Connection failed"));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!canDelete) return;
    const ok = window.confirm(
      t("dashboard.certificatesDesign.confirmDelete", "Delete this certificate permanently?"),
    );
    if (!ok) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/dashboard/settings/certificates?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t("dashboard.certificatesDesign.deleteFailed", "Failed to delete"));
        return;
      }
      setCertificates((prev) => prev.filter((c) => c.id !== id));
      setSuccess(t("dashboard.certificatesDesign.deleteSuccess", "Certificate deleted"));
    } catch {
      setError(t("dashboard.certificatesDesign.connectionFailed", "Connection failed"));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-6 space-y-8">
      <form onSubmit={onSave} className="space-y-6">
        {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

        <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">
            {t("dashboard.certificatesDesign.colorsTitle", "Colors")}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <ColorField
              label={t("dashboard.certificatesDesign.primaryColor", "Primary (border & titles)")}
              value={form.primaryColor}
              onChange={(v) => setForm((f) => ({ ...f, primaryColor: v }))}
            />
            <ColorField
              label={t("dashboard.certificatesDesign.accentColor", "Accent (links & course)")}
              value={form.accentColor}
              onChange={(v) => setForm((f) => ({ ...f, accentColor: v }))}
            />
            <ColorField
              label={t("dashboard.certificatesDesign.goldColor", "Highlight (gold)")}
              value={form.goldColor}
              onChange={(v) => setForm((f) => ({ ...f, goldColor: v }))}
            />
          </div>
        </section>

        <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">
            {t("dashboard.certificatesDesign.copyTitle", "Certificate text")}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">
                {t("dashboard.certificatesDesign.titleAr", "Title (Arabic)")}
              </label>
              <input
                value={form.titleAr ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))}
                placeholder={t("certificates.certTitle", "شهادة تقدير")}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">
                {t("dashboard.certificatesDesign.titleEn", "Title (English)")}
              </label>
              <input
                value={form.titleEn ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))}
                placeholder="Certificate of Achievement"
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">
                {t("dashboard.certificatesDesign.eyebrowAr", "Subtitle (Arabic)")}
              </label>
              <input
                value={form.eyebrowAr ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, eyebrowAr: e.target.value }))}
                placeholder={t("certificates.certOfCompletion", "شهادة إتمام دورة")}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">
                {t("dashboard.certificatesDesign.eyebrowEn", "Subtitle (English)")}
              </label>
              <input
                value={form.eyebrowEn ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, eyebrowEn: e.target.value }))}
                placeholder="Certificate of completion"
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">
            {t("dashboard.certificatesDesign.mediaTitle", "Logo & signature")}
          </h3>
          <div className="mt-4 space-y-4">
            <ImageUploadField
              label={t("dashboard.certificatesDesign.logoUrl", "Certificate logo")}
              value={form.logoUrl ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, logoUrl: v || null }))}
            />
            <ImageUploadField
              label={t("dashboard.certificatesDesign.signatureUrl", "Signature image")}
              value={form.signatureUrl ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, signatureUrl: v || null }))}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">
                  {t("dashboard.certificatesDesign.signatureLabelAr", "Signature label (Arabic)")}
                </label>
                <input
                  value={form.signatureLabelAr ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, signatureLabelAr: e.target.value }))}
                  placeholder={t("dashboard.certificatesDesign.signatureLabelPlaceholderAr", "مدير الأكاديمية")}
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)]">
                  {t("dashboard.certificatesDesign.signatureLabelEn", "Signature label (English)")}
                </label>
                <input
                  value={form.signatureLabelEn ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, signatureLabelEn: e.target.value }))}
                  placeholder="Academy Director"
                  className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">
            {t("dashboard.certificatesDesign.optionsTitle", "Display options")}
          </h3>
          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
              <input
                type="checkbox"
                checked={form.showScore}
                onChange={(e) => setForm((f) => ({ ...f, showScore: e.target.checked }))}
                className="rounded border-[var(--color-border)]"
              />
              {t("dashboard.certificatesDesign.showScore", "Show score on certificate")}
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
              <input
                type="checkbox"
                checked={form.showPattern}
                onChange={(e) => setForm((f) => ({ ...f, showPattern: e.target.checked }))}
                className="rounded border-[var(--color-border)]"
              />
              {t("dashboard.certificatesDesign.showPattern", "Show background pattern")}
            </label>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)]">
                {t("dashboard.certificatesDesign.borderWidth", "Border width (px)")}
              </label>
              <input
                type="number"
                min={2}
                max={16}
                value={form.borderWidth}
                onChange={(e) => setForm((f) => ({ ...f, borderWidth: Number(e.target.value) || 6 }))}
                className="mt-1 w-28 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-[var(--radius-btn)] bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {saving
              ? t("dashboard.certificatesDesign.saving", "Saving…")
              : t("dashboard.certificatesDesign.save", "Save design")}
          </button>
        </div>
      </form>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="text-base font-semibold text-[var(--color-foreground)]">
          {t("dashboard.certificatesDesign.previewTitle", "Live preview")}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t("dashboard.certificatesDesign.previewHelp", "Preview updates as you change the design fields above.")}
        </p>
        <div className="mt-6 overflow-x-auto">
          <CertificateDocument
            studentName={locale === "en" ? "Ahmed Nasr" : "أحمد نصر"}
            courseTitle={locale === "en" ? "Sample course" : "كورس تجريبي"}
            score={98}
            issuedAt={new Date()}
            certificateId="CERT-PREVIEW0001"
            academyName={academyName}
            locale={locale === "en" ? "en" : "ar"}
            labels={previewLabels}
            design={{
              ...form,
              signatureLabel,
            }}
          />
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="text-base font-semibold text-[var(--color-foreground)]">
          {t("dashboard.certificatesDesign.issuedTitle", "Issued certificates")}
        </h3>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          {t("dashboard.certificatesDesign.issuedHelp", "Latest certificates issued to trainees.")}
        </p>
        {certificates.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--color-muted)]">
            {t("dashboard.certificatesDesign.issuedEmpty", "No certificates issued yet.")}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-start text-[var(--color-muted)]">
                  <th className="px-2 py-2 font-medium">{t("dashboard.certificatesDesign.colStudent", "Student")}</th>
                  <th className="px-2 py-2 font-medium">{t("dashboard.certificatesDesign.colCourse", "Course")}</th>
                  <th className="px-2 py-2 font-medium">{t("dashboard.certificatesDesign.colScore", "Score")}</th>
                  <th className="px-2 py-2 font-medium">{t("dashboard.certificatesDesign.colId", "ID")}</th>
                  <th className="px-2 py-2 font-medium">{t("dashboard.certificatesDesign.colActions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-2 py-2 font-medium text-[var(--color-foreground)]">{c.studentName}</td>
                    <td className="px-2 py-2 text-[var(--color-muted)]">{c.courseTitle}</td>
                    <td className="px-2 py-2">{c.score != null ? `${c.score}%` : "—"}</td>
                    <td className="px-2 py-2 font-mono text-xs">{c.certificateId}</td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/certificates/${encodeURIComponent(c.id)}`}
                          className="text-[#2563EB] hover:underline"
                        >
                          {t("dashboard.certificatesDesign.view", "View")}
                        </Link>
                        {canDelete ? (
                          <button
                            type="button"
                            disabled={deletingId === c.id}
                            onClick={() => void onDelete(c.id)}
                            className="text-red-600 hover:underline disabled:opacity-50"
                          >
                            {deletingId === c.id
                              ? t("dashboard.certificatesDesign.deleting", "Deleting…")
                              : t("dashboard.certificatesDesign.delete", "Delete")}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
