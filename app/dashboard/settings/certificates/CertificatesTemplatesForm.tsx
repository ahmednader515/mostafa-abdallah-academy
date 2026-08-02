"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CertificateDocument } from "@/components/CertificateDocument";
import { useLocale, useT } from "@/components/LocaleProvider";
import {
  DEFAULT_CERTIFICATE_TEMPLATE,
  DEFAULT_SIGNATURE,
  type CertificateSignatureSlot,
  type CertificateTemplate,
} from "@/lib/certificate-templates-db";

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
          className="min-w-[120px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
        />
      </div>
    </div>
  );
}

function ImageUploadField({
  label,
  value,
  onChange,
  accept = "image/jpeg,image/png,image/webp,image/gif",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept?: string;
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
        <label className="cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium">
          {uploading
            ? t("dashboard.certificatesDesign.uploading", "Uploading…")
            : t("dashboard.certificatesDesign.chooseImage", "Upload image")}
          <input
            type="file"
            accept={accept}
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
          className="min-w-[160px] flex-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />
      </div>
      {uploadError ? <p className="mt-1 text-sm text-red-600">{uploadError}</p> : null}
    </div>
  );
}

function RangeField({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="flex items-center justify-between text-sm font-medium text-[var(--color-foreground)]">
        <span>{label}</span>
        <span className="font-mono text-[var(--color-muted)]">{value}%</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full"
      />
    </div>
  );
}

export function CertificatesTemplatesForm({
  initialTemplates,
  initialCertificates,
  academyName,
  canDelete,
}: {
  initialTemplates: CertificateTemplate[];
  initialCertificates: IssuedCertificate[];
  academyName: string;
  canDelete: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const Cd = "dashboard.certificatesDesign";

  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedId, setSelectedId] = useState(initialTemplates[0]?.id ?? "");
  const selected = templates.find((x) => x.id === selectedId) ?? templates[0] ?? null;
  const [form, setForm] = useState<CertificateTemplate | null>(selected);
  const [certificates, setCertificates] = useState(initialCertificates);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function selectTemplate(tpl: CertificateTemplate) {
    setSelectedId(tpl.id);
    setForm({ ...tpl, signatures: tpl.signatures.map((s) => ({ ...s })) });
    setError("");
    setSuccess("");
  }

  const previewLabels = useMemo(() => {
    const isEn = locale === "en";
    if (!form) {
      return {
        eyebrow: t("certificates.certOfCompletion"),
        title: t("certificates.certTitle"),
        awardedTo: t("certificates.awardedTo"),
        completionText: t("certificates.completionText"),
        withScore: t("certificates.withScore"),
        issuedOn: t("certificates.issuedOn"),
        certificateIdLabel: t("certificates.certificateId"),
      };
    }
    return {
      eyebrow: (isEn ? form.eyebrowEn : form.eyebrowAr)?.trim() || t("certificates.certOfCompletion"),
      title: (isEn ? form.titleEn : form.titleAr)?.trim() || t("certificates.certTitle"),
      awardedTo: t("certificates.awardedTo"),
      completionText: (isEn ? form.bodyEn : form.bodyAr)?.trim() || t("certificates.completionText"),
      withScore: t("certificates.withScore"),
      issuedOn: t("certificates.issuedOn"),
      certificateIdLabel: t("certificates.certificateId"),
    };
  }, [form, locale, t]);

  function updateSig(index: number, patch: Partial<CertificateSignatureSlot>) {
    if (!form) return;
    setForm({
      ...form,
      signatures: form.signatures.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/dashboard/settings/certificates/templates/${encodeURIComponent(form.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t(`${Cd}.saveFailed`, "Save failed"));
        return;
      }
      const updated = data.template as CertificateTemplate;
      setTemplates((list) => list.map((x) => (x.id === updated.id ? updated : { ...x, isDefault: updated.isDefault ? false : x.isDefault })));
      setForm(updated);
      setSuccess(t(`${Cd}.saved`, "Saved successfully"));
      router.refresh();
    } catch {
      setError(t(`${Cd}.saveFailed`, "Save failed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    setError("");
    try {
      const res = await fetch("/api/dashboard/settings/certificates/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...DEFAULT_CERTIFICATE_TEMPLATE,
          name: t(`${Cd}.newTemplateName`, "New template"),
          nameAr: t(`${Cd}.newTemplateNameAr`, "قالب جديد"),
          isDefault: false,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t(`${Cd}.createFailed`, "Create failed"));
        return;
      }
      const tpl = data.template as CertificateTemplate;
      setTemplates((list) => [tpl, ...list]);
      selectTemplate(tpl);
      router.refresh();
    } catch {
      setError(t(`${Cd}.createFailed`, "Create failed"));
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!canDelete) return;
    if (!confirm(t(`${Cd}.confirmDeleteTemplate`, "Delete this template?"))) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/dashboard/settings/certificates/templates/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t(`${Cd}.deleteFailed`, "Delete failed"));
        return;
      }
      const next = templates.filter((x) => x.id !== id);
      setTemplates(next);
      if (next[0]) selectTemplate(next[0]);
      else setForm(null);
      router.refresh();
    } catch {
      setError(t(`${Cd}.deleteFailed`, "Delete failed"));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteCert(id: string) {
    if (!canDelete) return;
    if (!confirm(t(`${Cd}.confirmDeleteCert`, "Delete this issued certificate?"))) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/dashboard/settings/certificates?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) setCertificates((c) => c.filter((x) => x.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  if (!form) {
    return (
      <div className="mt-6">
        <button
          type="button"
          onClick={() => void handleCreate()}
          className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white"
        >
          {t(`${Cd}.createTemplate`, "Create template")}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        {templates.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            onClick={() => selectTemplate(tpl)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              tpl.id === form.id
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "border-[var(--color-border)] text-[var(--color-foreground)]"
            }`}
          >
            {locale === "ar" ? tpl.nameAr || tpl.name : tpl.name}
            {tpl.isDefault ? ` · ${t(`${Cd}.defaultBadge`, "Default")}` : ""}
          </button>
        ))}
        <button
          type="button"
          onClick={() => void handleCreate()}
          className="rounded-full border border-dashed border-[var(--color-border)] px-3 py-1.5 text-sm"
        >
          + {t(`${Cd}.createTemplate`, "Create template")}
        </button>
      </div>

      <form onSubmit={handleSave} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">{t(`${Cd}.templateNameEn`, "Template name (EN)")}</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">{t(`${Cd}.templateNameAr`, "Template name (AR)")}</label>
              <input
                value={form.nameAr ?? ""}
                onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">{t(`${Cd}.orientation`, "Orientation")}</label>
              <select
                value={form.orientation}
                onChange={(e) =>
                  setForm({ ...form, orientation: e.target.value === "landscape" ? "landscape" : "portrait" })
                }
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              >
                <option value="portrait">{t(`${Cd}.portrait`, "Portrait")}</option>
                <option value="landscape">{t(`${Cd}.landscape`, "Landscape")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">{t(`${Cd}.fontFamily`, "Font")}</label>
              <select
                value={form.fontFamily}
                onChange={(e) =>
                  setForm({
                    ...form,
                    fontFamily: e.target.value as CertificateTemplate["fontFamily"],
                  })
                }
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              >
                <option value="Cairo">Cairo</option>
                <option value="Tajawal">Tajawal</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">{t(`${Cd}.frameStyle`, "Frame")}</label>
              <select
                value={form.frameStyle}
                onChange={(e) =>
                  setForm({
                    ...form,
                    frameStyle: e.target.value as CertificateTemplate["frameStyle"],
                  })
                }
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              >
                <option value="solid">{t(`${Cd}.frameSolid`, "Solid")}</option>
                <option value="double">{t(`${Cd}.frameDouble`, "Double")}</option>
                <option value="ornate">{t(`${Cd}.frameOrnate`, "Ornate")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">{t(`${Cd}.borderWidth`, "Border width")}</label>
              <input
                type="number"
                min={2}
                max={16}
                value={form.borderWidth}
                onChange={(e) => setForm({ ...form, borderWidth: Number(e.target.value) || 6 })}
                className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField label={t(`${Cd}.primaryColor`, "Primary")} value={form.primaryColor} onChange={(v) => setForm({ ...form, primaryColor: v })} />
            <ColorField label={t(`${Cd}.accentColor`, "Accent")} value={form.accentColor} onChange={(v) => setForm({ ...form, accentColor: v })} />
            <ColorField label={t(`${Cd}.goldColor`, "Gold")} value={form.goldColor} onChange={(v) => setForm({ ...form, goldColor: v })} />
            <ColorField label={t(`${Cd}.bgColor`, "Background")} value={form.bgColor} onChange={(v) => setForm({ ...form, bgColor: v })} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.showScore} onChange={(e) => setForm({ ...form, showScore: e.target.checked })} />
              {t(`${Cd}.showScore`, "Show score")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.showPattern} onChange={(e) => setForm({ ...form, showPattern: e.target.checked })} />
              {t(`${Cd}.showPattern`, "Show pattern")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.showQr} onChange={(e) => setForm({ ...form, showQr: e.target.checked })} />
              {t(`${Cd}.showQr`, "Show QR code")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.showSeal} onChange={(e) => setForm({ ...form, showSeal: e.target.checked })} />
              {t(`${Cd}.showSeal`, "Show academy seal")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
              {t(`${Cd}.setAsDefault`, "Set as default template")}
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">{t(`${Cd}.titleAr`, "Title (AR)")}</label>
              <input value={form.titleAr ?? ""} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium">{t(`${Cd}.titleEn`, "Title (EN)")}</label>
              <input value={form.titleEn ?? ""} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium">{t(`${Cd}.eyebrowAr`, "Eyebrow (AR)")}</label>
              <input value={form.eyebrowAr ?? ""} onChange={(e) => setForm({ ...form, eyebrowAr: e.target.value })} className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium">{t(`${Cd}.eyebrowEn`, "Eyebrow (EN)")}</label>
              <input value={form.eyebrowEn ?? ""} onChange={(e) => setForm({ ...form, eyebrowEn: e.target.value })} className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium">{t(`${Cd}.bodyAr`, "Body text (AR)")}</label>
              <textarea value={form.bodyAr ?? ""} onChange={(e) => setForm({ ...form, bodyAr: e.target.value })} rows={2} className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium">{t(`${Cd}.bodyEn`, "Body text (EN)")}</label>
              <textarea value={form.bodyEn ?? ""} onChange={(e) => setForm({ ...form, bodyEn: e.target.value })} rows={2} className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm" />
            </div>
          </div>

          <ImageUploadField label={t(`${Cd}.logo`, "Logo")} value={form.logoUrl ?? ""} onChange={(url) => setForm({ ...form, logoUrl: url })} />
          <RangeField label={t(`${Cd}.logoWidth`, "Logo width")} value={form.logoWidthPct} min={5} max={40} onChange={(n) => setForm({ ...form, logoWidthPct: n })} />
          <RangeField label={t(`${Cd}.logoY`, "Logo vertical position")} value={form.logoYPct} min={0} max={30} onChange={(n) => setForm({ ...form, logoYPct: n })} />

          <ImageUploadField
            label={t(`${Cd}.seal`, "Academy seal (PNG)")}
            value={form.sealUrl ?? ""}
            onChange={(url) => setForm({ ...form, sealUrl: url })}
            accept="image/png,image/webp,image/jpeg"
          />
          {form.showSeal ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <RangeField label={t(`${Cd}.sealWidth`, "Seal size")} value={form.sealWidthPct} min={5} max={35} onChange={(n) => setForm({ ...form, sealWidthPct: n })} />
              <RangeField label={t(`${Cd}.sealX`, "Seal X")} value={form.sealXPct} onChange={(n) => setForm({ ...form, sealXPct: n })} />
              <RangeField label={t(`${Cd}.sealY`, "Seal Y")} value={form.sealYPct} onChange={(n) => setForm({ ...form, sealYPct: n })} />
            </div>
          ) : null}

          <div className="space-y-4 border-t border-[var(--color-border)] pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[var(--color-foreground)]">{t(`${Cd}.signatures`, "Signatures")}</h3>
              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    signatures: [
                      ...form.signatures,
                      { ...DEFAULT_SIGNATURE, xPct: 30 + form.signatures.length * 20, yPct: 82 },
                    ],
                  })
                }
                className="text-sm text-[var(--color-primary)] hover:underline"
              >
                + {t(`${Cd}.addSignature`, "Add signature")}
              </button>
            </div>
            {form.signatures.map((sig, i) => (
              <div key={i} className="space-y-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {t(`${Cd}.signatureN`, "Signature")} {i + 1}
                  </p>
                  {form.signatures.length > 1 ? (
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:underline"
                      onClick={() =>
                        setForm({ ...form, signatures: form.signatures.filter((_, idx) => idx !== i) })
                      }
                    >
                      {t(`${Cd}.remove`, "Remove")}
                    </button>
                  ) : null}
                </div>
                <ImageUploadField
                  label={t(`${Cd}.signatureImage`, "Signature image (PNG)")}
                  value={sig.imageUrl ?? ""}
                  onChange={(url) => updateSig(i, { imageUrl: url })}
                  accept="image/png,image/webp"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    placeholder={t(`${Cd}.signerNameAr`, "Signer name (AR)")}
                    value={sig.nameAr ?? ""}
                    onChange={(e) => updateSig(i, { nameAr: e.target.value })}
                    className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                  />
                  <input
                    placeholder={t(`${Cd}.signerNameEn`, "Signer name (EN)")}
                    value={sig.nameEn ?? ""}
                    onChange={(e) => updateSig(i, { nameEn: e.target.value })}
                    className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                  />
                  <input
                    placeholder={t(`${Cd}.signerTitleAr`, "Title (AR)")}
                    value={sig.titleAr ?? ""}
                    onChange={(e) => updateSig(i, { titleAr: e.target.value })}
                    className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                  />
                  <input
                    placeholder={t(`${Cd}.signerTitleEn`, "Title (EN)")}
                    value={sig.titleEn ?? ""}
                    onChange={(e) => updateSig(i, { titleEn: e.target.value })}
                    className="rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <RangeField label={t(`${Cd}.sigWidth`, "Size")} value={sig.widthPct} min={8} max={40} onChange={(n) => updateSig(i, { widthPct: n })} />
                  <RangeField label="X" value={sig.xPct} onChange={(n) => updateSig(i, { xPct: n })} />
                  <RangeField label="Y" value={sig.yPct} onChange={(n) => updateSig(i, { yPct: n })} />
                </div>
              </div>
            ))}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-green-600">{success}</p> : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? t(`${Cd}.saving`, "Saving…") : t(`${Cd}.save`, "Save template")}
            </button>
            {canDelete && !form.isDefault ? (
              <button
                type="button"
                disabled={deletingId === form.id}
                onClick={() => void handleDeleteTemplate(form.id)}
                className="rounded-[var(--radius-btn)] border border-red-500/40 px-4 py-2 text-sm text-red-600"
              >
                {t(`${Cd}.deleteTemplate`, "Delete template")}
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--color-foreground)]">{t(`${Cd}.livePreview`, "Live preview")}</h3>
          <div className="overflow-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <CertificateDocument
              studentName={locale === "ar" ? "أحمد محمد" : "Ahmed Mohamed"}
              courseTitle={locale === "ar" ? "دورة تجريبية" : "Sample Course"}
              score={95}
              issuedAt={new Date()}
              certificateId="CERT-PREVIEW0001"
              academyName={academyName}
              locale={locale === "en" ? "en" : "ar"}
              verifyUrl="/certificate/CERT-PREVIEW0001"
              labels={previewLabels}
              design={form}
            />
          </div>
        </div>
      </form>

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h3 className="font-semibold text-[var(--color-foreground)]">
          {t(`${Cd}.issuedList`, "Issued certificates")}
        </h3>
        <ul className="mt-4 divide-y divide-[var(--color-border)]">
          {certificates.length === 0 ? (
            <li className="py-3 text-sm text-[var(--color-muted)]">{t(`${Cd}.noIssued`, "No certificates yet")}</li>
          ) : (
            certificates.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium text-[var(--color-foreground)]">{c.studentName}</p>
                  <p className="text-[var(--color-muted)]">
                    {c.courseTitle} · {c.certificateId}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/certificate/${encodeURIComponent(c.certificateId)}`}
                    className="text-[var(--color-primary)] hover:underline"
                  >
                    {t(`${Cd}.view`, "View")}
                  </Link>
                  {canDelete ? (
                    <button
                      type="button"
                      disabled={deletingId === c.id}
                      onClick={() => void handleDeleteCert(c.id)}
                      className="text-red-600 hover:underline"
                    >
                      {t(`${Cd}.delete`, "Delete")}
                    </button>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
