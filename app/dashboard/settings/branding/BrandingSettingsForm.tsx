"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";

type BrandingSettings = {
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  faviconUrl: string | null;
  headerLogoUrl: string | null;
  platformName: string | null;
  platformNameEn: string | null;
  platformNameColor: string | null;
  platformNameColor2: string | null;
  showPlatformName: boolean;
  showPlatformLogo: boolean;
  ga4Id: string | null;
  gtmId: string | null;
  facebookPixelId: string | null;
  metaCapiConfigured?: boolean;
  metaCapiAccessToken?: string | null;
  contactEmail: string | null;
  defaultCurrency: string | null;
  seoTitle: string | null;
  seoTitleEn: string | null;
  seoDescription: string | null;
  seoDescriptionEn: string | null;
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
  previewClassName,
  accept = "image/jpeg,image/png,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon",
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  previewClassName?: string;
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
      if (res.ok && data.url) {
        onChange(String(data.url));
      } else {
        setUploadError(data.error || t("dashboard.brandingForm.uploadFailed", "Upload failed"));
      }
    } catch {
      setUploadError(t("dashboard.brandingForm.uploadConnectionFailed", "Connection failed during upload"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-foreground)]">{label}</label>
      {value ? (
        <div className="mt-2 flex flex-wrap items-start gap-3">
          <img
            src={value}
            alt=""
            className={
              previewClassName ??
              "h-16 w-auto max-w-[200px] rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] object-contain p-1"
            }
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-sm text-red-600 hover:underline"
          >
            {t("dashboard.brandingForm.removeImage", "Remove")}
          </button>
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--color-border)]/50">
          {uploading
            ? t("dashboard.brandingForm.uploading", "Uploading…")
            : t("dashboard.brandingForm.chooseImage", "Upload image")}
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              await uploadFile(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <input
        type="text"
        dir="ltr"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setUploadError("");
        }}
        placeholder="https://… (or upload above)"
        className="mt-2 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
      />
      {uploadError ? <p className="mt-1 text-sm text-red-600">{uploadError}</p> : null}
    </div>
  );
}

export function BrandingSettingsForm({ initialSettings }: { initialSettings: BrandingSettings }) {
  const router = useRouter();
  const t = useT();
  const [form, setForm] = useState({
    primaryColor: initialSettings.primaryColor ?? "",
    secondaryColor: initialSettings.secondaryColor ?? "",
    accentColor: initialSettings.accentColor ?? "",
    backgroundColor: initialSettings.backgroundColor ?? "",
    faviconUrl: initialSettings.faviconUrl ?? "",
    headerLogoUrl: initialSettings.headerLogoUrl ?? "",
    platformName: initialSettings.platformName ?? "",
    platformNameEn: initialSettings.platformNameEn ?? "",
    platformNameColor: initialSettings.platformNameColor ?? "#FFFFFF",
    platformNameColor2: initialSettings.platformNameColor2 ?? "",
    showPlatformName: initialSettings.showPlatformName !== false,
    showPlatformLogo: initialSettings.showPlatformLogo !== false,
    ga4Id: initialSettings.ga4Id ?? "",
    gtmId: initialSettings.gtmId ?? "",
    facebookPixelId: initialSettings.facebookPixelId ?? "",
    metaCapiAccessToken: "",
    contactEmail: initialSettings.contactEmail ?? "",
    defaultCurrency: initialSettings.defaultCurrency ?? "EGP",
    seoTitle: initialSettings.seoTitle ?? "",
    seoTitleEn: initialSettings.seoTitleEn ?? "",
    seoDescription: initialSettings.seoDescription ?? "",
    seoDescriptionEn: initialSettings.seoDescriptionEn ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  async function handleSave() {
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/settings/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryColor: form.primaryColor.trim() || null,
          secondaryColor: form.secondaryColor.trim() || null,
          accentColor: form.accentColor.trim() || null,
          backgroundColor: form.backgroundColor.trim() || null,
          faviconUrl: form.faviconUrl.trim() || null,
          headerLogoUrl: form.headerLogoUrl.trim() || null,
          platformName: form.platformName.trim() || null,
          platformNameEn: form.platformNameEn.trim() || null,
          platformNameColor: form.platformNameColor.trim() || null,
          platformNameColor2: form.platformNameColor2.trim() || null,
          showPlatformName: form.showPlatformName,
          showPlatformLogo: form.showPlatformLogo,
          ga4Id: form.ga4Id.trim() || null,
          gtmId: form.gtmId.trim() || null,
          facebookPixelId: form.facebookPixelId.trim() || null,
          ...(form.metaCapiAccessToken.trim()
            ? { metaCapiAccessToken: form.metaCapiAccessToken.trim() }
            : {}),
          contactEmail: form.contactEmail.trim() || null,
          defaultCurrency: form.defaultCurrency.trim() || "EGP",
          seoTitle: form.seoTitle.trim() || null,
          seoTitleEn: form.seoTitleEn.trim() || null,
          seoDescription: form.seoDescription.trim() || null,
          seoDescriptionEn: form.seoDescriptionEn.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("dashboard.brandingForm.saveFailed", "Failed to save"));
      setSuccess(t("dashboard.brandingForm.saveSuccess", "Branding settings saved"));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("dashboard.brandingForm.saveFailed", "Failed to save"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 max-w-2xl space-y-6 pb-10">
      {error ? (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-[var(--radius-btn)] bg-emerald-500/15 px-3 py-2.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          {success}
        </div>
      ) : null}

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t("dashboard.brandingForm.colorsTitle", "Brand colors")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField
            label={t("dashboard.brandingForm.primaryColor", "Primary color")}
            value={form.primaryColor}
            onChange={(v) => setForm((f) => ({ ...f, primaryColor: v }))}
          />
          <ColorField
            label={t("dashboard.brandingForm.secondaryColor", "Secondary color")}
            value={form.secondaryColor}
            onChange={(v) => setForm((f) => ({ ...f, secondaryColor: v }))}
          />
          <ColorField
            label={t("dashboard.brandingForm.accentColor", "Accent color")}
            value={form.accentColor}
            onChange={(v) => setForm((f) => ({ ...f, accentColor: v }))}
          />
          <ColorField
            label={t("dashboard.brandingForm.backgroundColor", "Background color")}
            value={form.backgroundColor}
            onChange={(v) => setForm((f) => ({ ...f, backgroundColor: v }))}
          />
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t("dashboard.brandingForm.identityTitle", "Identity")}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">
              {t("dashboard.brandingForm.platformName", "Platform name (Arabic)")}
            </label>
            <input
              type="text"
              value={form.platformName}
              onChange={(e) => setForm((f) => ({ ...f, platformName: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">
              {t("dashboard.brandingForm.platformNameEn", "Platform name (English)")}
            </label>
            <input
              type="text"
              dir="ltr"
              value={form.platformNameEn}
              onChange={(e) => setForm((f) => ({ ...f, platformNameEn: e.target.value }))}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
          </div>
          <ImageUploadField
            label={t("dashboard.brandingForm.headerLogo", "Header logo")}
            value={form.headerLogoUrl}
            onChange={(url) => setForm((f) => ({ ...f, headerLogoUrl: url }))}
            previewClassName="h-14 w-auto max-w-[220px] rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] object-contain p-1"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <ColorField
              label={t("dashboard.brandingForm.nameColor", "Name color")}
              value={form.platformNameColor}
              onChange={(v) => setForm((f) => ({ ...f, platformNameColor: v }))}
            />
            <ColorField
              label={t("dashboard.brandingForm.nameColor2", "Second name color (optional)")}
              value={form.platformNameColor2 || "#F59E0B"}
              onChange={(v) => setForm((f) => ({ ...f, platformNameColor2: v }))}
            />
          </div>
          <p className="text-xs text-[var(--color-muted)]">
            {t(
              "dashboard.brandingForm.nameColorHint",
              "Leave the second color empty for a single-color name. Set both for a two-tone name.",
            )}
          </p>
          <button
            type="button"
            className="text-xs text-[var(--color-primary)] hover:underline"
            onClick={() => setForm((f) => ({ ...f, platformNameColor2: "" }))}
          >
            {t("dashboard.brandingForm.clearSecondColor", "Use single color only")}
          </button>
          <div className="flex flex-wrap gap-6">
            <label className="inline-flex items-center gap-2 text-sm text-[var(--color-foreground)]">
              <input
                type="checkbox"
                checked={form.showPlatformLogo}
                onChange={(e) => setForm((f) => ({ ...f, showPlatformLogo: e.target.checked }))}
              />
              {t("dashboard.brandingForm.showLogo", "Show logo image")}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-[var(--color-foreground)]">
              <input
                type="checkbox"
                checked={form.showPlatformName}
                onChange={(e) => setForm((f) => ({ ...f, showPlatformName: e.target.checked }))}
              />
              {t("dashboard.brandingForm.showName", "Show platform name")}
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-2 text-lg font-semibold text-[var(--color-foreground)]">
          {t("dashboard.brandingForm.browserTitle", "Browser tab")}
        </h3>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          {t(
            "dashboard.brandingForm.browserIntro",
            "Controls the favicon and the title/description shown in the browser tab and search results.",
          )}
        </p>
        <div className="space-y-4">
          <ImageUploadField
            label={t("dashboard.brandingForm.favicon", "Favicon")}
            value={form.faviconUrl}
            onChange={(url) => setForm((f) => ({ ...f, faviconUrl: url }))}
            previewClassName="h-10 w-10 rounded border border-[var(--color-border)] bg-[var(--color-background)] object-contain p-0.5"
            accept="image/jpeg,image/png,image/webp,image/gif,image/x-icon,image/vnd.microsoft.icon,image/svg+xml"
          />
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">
              {t("dashboard.brandingForm.seoTitle", "Browser title (Arabic)")}
            </label>
            <input
              value={form.seoTitle}
              onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
              placeholder={t("dashboard.brandingForm.seoTitlePh", "Shown in the browser tab")}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">
              {t("dashboard.brandingForm.seoTitleEn", "Browser title (English)")}
            </label>
            <input
              dir="ltr"
              value={form.seoTitleEn}
              onChange={(e) => setForm((f) => ({ ...f, seoTitleEn: e.target.value }))}
              placeholder="Shown in the browser tab (English)"
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">
              {t("dashboard.brandingForm.seoDescription", "Browser description (Arabic)")}
            </label>
            <textarea
              value={form.seoDescription}
              onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
              rows={3}
              placeholder={t(
                "dashboard.brandingForm.seoDescriptionPh",
                "Short description for search engines and link previews",
              )}
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">
              {t("dashboard.brandingForm.seoDescriptionEn", "Browser description (English)")}
            </label>
            <textarea
              dir="ltr"
              value={form.seoDescriptionEn}
              onChange={(e) => setForm((f) => ({ ...f, seoDescriptionEn: e.target.value }))}
              rows={3}
              placeholder="Short description for search engines and link previews (English)"
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-2 text-lg font-semibold text-[var(--color-foreground)]">
          {t("dashboard.brandingForm.analyticsTitle", "Analytics & tracking")}
        </h3>
        <p className="mb-4 text-sm text-[var(--color-muted)]">
          {t("dashboard.brandingForm.analyticsIntro", "Leave empty to disable a given integration.")}
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">
              {t("dashboard.brandingForm.ga4Id", "Google Analytics 4 (GA4) ID")}
            </label>
            <input
              type="text"
              dir="ltr"
              value={form.ga4Id}
              onChange={(e) => setForm((f) => ({ ...f, ga4Id: e.target.value }))}
              placeholder="G-XXXXXXXXXX"
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">
              {t("dashboard.brandingForm.gtmId", "Google Tag Manager (GTM) ID")}
            </label>
            <input
              type="text"
              dir="ltr"
              value={form.gtmId}
              onChange={(e) => setForm((f) => ({ ...f, gtmId: e.target.value }))}
              placeholder="GTM-XXXXXXX"
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">
              {t("dashboard.brandingForm.facebookPixelId", "Facebook Pixel ID")}
            </label>
            <input
              type="text"
              dir="ltr"
              value={form.facebookPixelId}
              onChange={(e) => setForm((f) => ({ ...f, facebookPixelId: e.target.value }))}
              placeholder="123456789012345"
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-foreground)]">
              {t("dashboard.brandingForm.metaCapiAccessToken", "Meta Conversions API access token")}
            </label>
            <input
              type="password"
              dir="ltr"
              autoComplete="new-password"
              value={form.metaCapiAccessToken}
              onChange={(e) => setForm((f) => ({ ...f, metaCapiAccessToken: e.target.value }))}
              placeholder={
                initialSettings.metaCapiConfigured
                  ? t("dashboard.brandingForm.metaCapiTokenConfigured", "Configured — paste a new token to replace")
                  : "EAAB..."
              }
              className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              {t(
                "dashboard.brandingForm.metaCapiHelp",
                "Events are sent manually (Pixel + CAPI). Automatic Pixel event tracking is disabled. You can also set META_CAPI_ACCESS_TOKEN in the server environment.",
              )}
            </p>
            {initialSettings.metaCapiConfigured ? (
              <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {t("dashboard.brandingForm.metaCapiReady", "Conversions API is configured.")}
              </p>
            ) : (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                {t(
                  "dashboard.brandingForm.metaCapiMissing",
                  "Add an access token to enable server-side Conversions API.",
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
        <h3 className="font-semibold">{t("dashboard.brandingForm.generalSeo", "General")}</h3>
        <div>
          <label className="block text-sm font-medium">{t("dashboard.brandingForm.contactEmail", "Contact email")}</label>
          <input
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
            className="mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">{t("dashboard.brandingForm.defaultCurrency", "Default currency")}</label>
          <input
            value={form.defaultCurrency}
            onChange={(e) => setForm((f) => ({ ...f, defaultCurrency: e.target.value }))}
            className="mt-1 w-full max-w-xs rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
      >
        {saving ? t("dashboard.brandingForm.saveButtonBusy", "Saving...") : t("dashboard.brandingForm.saveButtonIdle", "Save")}
      </button>
    </div>
  );
}
