"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import { useDashboardTable } from "@/lib/i18n/dashboard-table";
import { fillMessage } from "@/lib/i18n/interpolate";
import type { SubscriptionDurationKind } from "@/lib/types";
import {
  SUBSCRIPTION_DURATION_KINDS,
  normalizeSubscriptionDurationKind,
  subscriptionDurationLabel,
} from "@/lib/subscription-duration";
import { resolveSubscriptionPlanPricing } from "@/lib/subscription-pricing";

export type CoverageOption = { id: string; label: string };

export type AdminPlanRow = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  durationKind: SubscriptionDurationKind;
  price: number;
  discountPrice?: number | null;
  discountPercent?: number | null;
  buttonText?: string | null;
  accentColor?: string | null;
  badgeText?: string | null;
  featuresJson?: string | null;
  sortOrder?: number;
  isActive: boolean;
  coversCourses?: boolean;
  coversLibrary?: boolean;
  coversExternalTraining?: boolean;
  courseCategoryIds?: string[];
  libraryCategoryIds?: string[];
  externalTrainingIds?: string[];
};

function toggleId(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function CoverageMultiSelect({
  label,
  options,
  selected,
  onChange,
  disabled,
}: {
  label: string;
  options: CoverageOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  if (disabled) return null;
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]/40 p-3">
      <p className="mb-2 text-xs font-semibold text-[var(--color-muted)]">{label}</p>
      {options.length === 0 ? (
        <p className="text-xs text-[var(--color-muted)]">—</p>
      ) : (
        <div className="max-h-40 space-y-1.5 overflow-y-auto text-sm">
          {options.map((opt) => (
            <label key={opt.id} className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={selected.includes(opt.id)}
                onChange={() => onChange(toggleId(selected, opt.id))}
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

const DEFAULT_BUTTON = "اشترك الآن";
const ACCENT_PRESETS = ["#0f766e", "#b45309", "#1d4ed8", "#be123c", "#4338ca", "#047857"];

function parseMoney(raw: string): number | null {
  const p = parseFloat(raw.replace(",", "."));
  if (Number.isNaN(p) || p < 0) return null;
  return p;
}

function parseOptionalMoney(raw: string): number | null | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return parseMoney(trimmed);
}

export function SubscriptionsAdminClient({
  initialEnabled,
  initialPlans,
  courseCategoryOptions = [],
  libraryCategoryOptions = [],
  externalTrainingOptions = [],
}: {
  initialEnabled: boolean;
  initialPlans: AdminPlanRow[];
  courseCategoryOptions?: CoverageOption[];
  libraryCategoryOptions?: CoverageOption[];
  externalTrainingOptions?: CoverageOption[];
}) {
  const router = useRouter();
  const t = useT();
  const Su = "dashboard.subscriptionsAdmin";
  const egp = t("common.egyptianPoundShort");
  const { dir, thClass } = useDashboardTable();

  function dkLabel(d: string): string {
    return subscriptionDurationLabel(d, t);
  }
  const [enabled, setEnabled] = useState(initialEnabled);
  const [plans, setPlans] = useState(initialPlans);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationKind, setDurationKind] = useState<SubscriptionDurationKind>("month");
  const [customDays, setCustomDays] = useState("30");
  const [coversCourses, setCoversCourses] = useState(true);
  const [coversLibrary, setCoversLibrary] = useState(true);
  const [coversExternal, setCoversExternal] = useState(false);
  const [courseCategoryIds, setCourseCategoryIds] = useState<string[]>([]);
  const [libraryCategoryIds, setLibraryCategoryIds] = useState<string[]>([]);
  const [externalTrainingIds, setExternalTrainingIds] = useState<string[]>([]);
  const [editCoversCourses, setEditCoversCourses] = useState(true);
  const [editCoversLibrary, setEditCoversLibrary] = useState(true);
  const [editCoversExternal, setEditCoversExternal] = useState(false);
  const [editCourseCategoryIds, setEditCourseCategoryIds] = useState<string[]>([]);
  const [editLibraryCategoryIds, setEditLibraryCategoryIds] = useState<string[]>([]);
  const [editExternalTrainingIds, setEditExternalTrainingIds] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [buttonText, setButtonText] = useState(DEFAULT_BUTTON);
  const [accentColor, setAccentColor] = useState("#0f766e");
  const [badgeText, setBadgeText] = useState("");
  const [featuresJson, setFeaturesJson] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDurationKind, setEditDurationKind] = useState<SubscriptionDurationKind>("month");
  const [editCustomDays, setEditCustomDays] = useState("30");
  const [editPrice, setEditPrice] = useState("");
  const [editDiscountPrice, setEditDiscountPrice] = useState("");
  const [editDiscountPercent, setEditDiscountPercent] = useState("");
  const [editButtonText, setEditButtonText] = useState(DEFAULT_BUTTON);
  const [editAccentColor, setEditAccentColor] = useState("#0f766e");
  const [editBadgeText, setEditBadgeText] = useState("");
  const [editFeaturesJson, setEditFeaturesJson] = useState("");
  const [editSortOrder, setEditSortOrder] = useState("0");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [editImageUploading, setEditImageUploading] = useState(false);
  const [editImageError, setEditImageError] = useState("");

  const reloadPlans = useCallback(async () => {
    const res = await fetch("/api/dashboard/subscription-plans", { credentials: "include" });
    if (!res.ok) return;
    const data = (await res.json()) as { plans?: AdminPlanRow[] };
    if (data.plans) setPlans(data.plans);
  }, []);

  async function patchEnabled(next: boolean) {
    setError("");
    setToggleLoading(true);
    const res = await fetch("/api/dashboard/settings/subscriptions-enabled", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });
    const data = await res.json().catch(() => ({}));
    setToggleLoading(false);
    if (!res.ok) {
      setError(data.error ?? t(`${Su}.updateFailed`));
      return;
    }
    setEnabled(next);
    setSuccess(next ? t(`${Su}.enabledHome`) : t(`${Su}.disabledHome`));
    router.refresh();
  }

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const p = parseMoney(price);
    if (p == null) {
      setError(t(`${Su}.invalidPrice`));
      return;
    }
    const dp = parseOptionalMoney(discountPrice);
    if (discountPrice.trim() && dp == null) {
      setError(t(`${Su}.invalidDiscountPrice`, "أدخل سعر خصم صالحاً أو اتركه فارغاً"));
      return;
    }
    const dPctRaw = discountPercent.trim();
    let dPct: number | null = null;
    if (dPctRaw) {
      const n = parseFloat(dPctRaw.replace(",", "."));
      if (Number.isNaN(n) || n < 0 || n > 100) {
        setError(t(`${Su}.invalidDiscountPercent`, "نسبة الخصم يجب أن تكون بين 0 و 100"));
        return;
      }
      dPct = n;
    }
    setFormLoading(true);
    const res = await fetch("/api/dashboard/subscription-plans", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: description.trim(),
        durationKind,
        durationValue: durationKind === "custom_days" ? Math.max(1, parseInt(customDays, 10) || 30) : 1,
        price: p,
        discountPrice: dp ?? null,
        discountPercent: dPct,
        buttonText: buttonText.trim() || null,
        accentColor: accentColor.trim() || null,
        badgeText: badgeText.trim() || null,
        featuresJson: featuresJson.trim() || null,
        sortOrder: Math.max(0, parseInt(sortOrder, 10) || 0),
        imageUrl: imageUrl.trim() || null,
        coversCourses,
        coversLibrary,
        coversExternalTraining: coversExternal,
        courseCategoryIds: coversCourses ? courseCategoryIds : [],
        libraryCategoryIds: coversLibrary ? libraryCategoryIds : [],
        externalTrainingIds: coversExternal ? externalTrainingIds : [],
      }),
    });
    const data = await res.json().catch(() => ({}));
    setFormLoading(false);
    if (!res.ok) {
      setError(data.error ?? t(`${Su}.createFailed`));
      return;
    }
    setSuccess(t(`${Su}.createSuccess`));
    setName("");
    setDescription("");
    setDurationKind("month");
    setPrice("");
    setDiscountPrice("");
    setDiscountPercent("");
    setButtonText(DEFAULT_BUTTON);
    setAccentColor("#0f766e");
    setBadgeText("");
    setFeaturesJson("");
    setSortOrder("0");
    setImageUrl("");
    setImageError("");
    setCoversCourses(true);
    setCoversLibrary(true);
    setCoversExternal(false);
    setCourseCategoryIds([]);
    setLibraryCategoryIds([]);
    setExternalTrainingIds([]);
    await reloadPlans();
    router.refresh();
  }

  function openEdit(row: AdminPlanRow) {
    setError("");
    setSuccess("");
    setEditingId(row.id);
    setEditName(row.name);
    setEditDescription(row.description ?? "");
    setEditDurationKind(normalizeSubscriptionDurationKind(row.durationKind) ?? "month");
    setEditCustomDays("30");
    setEditPrice(String(row.price ?? 0));
    setEditDiscountPrice(row.discountPrice != null ? String(row.discountPrice) : "");
    setEditDiscountPercent(row.discountPercent != null ? String(row.discountPercent) : "");
    setEditButtonText(row.buttonText?.trim() || DEFAULT_BUTTON);
    setEditAccentColor(row.accentColor?.trim() || "#0f766e");
    setEditBadgeText(row.badgeText ?? "");
    setEditFeaturesJson(row.featuresJson ?? "");
    setEditSortOrder(String(row.sortOrder ?? 0));
    setEditImageUrl(row.imageUrl ?? "");
    setEditActive(row.isActive);
    setEditCoversCourses(row.coversCourses !== false);
    setEditCoversLibrary(row.coversLibrary !== false);
    setEditCoversExternal(!!row.coversExternalTraining);
    setEditCourseCategoryIds(row.courseCategoryIds ?? []);
    setEditLibraryCategoryIds(row.libraryCategoryIds ?? []);
    setEditExternalTrainingIds(row.externalTrainingIds ?? []);
    setEditImageError("");
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditingId(null);
    setEditLoading(false);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError("");
    setSuccess("");
    const p = parseMoney(editPrice);
    if (p == null) {
      setError(t(`${Su}.invalidPrice`));
      return;
    }
    const dp = parseOptionalMoney(editDiscountPrice);
    if (editDiscountPrice.trim() && dp == null) {
      setError(t(`${Su}.invalidDiscountPrice`, "أدخل سعر خصم صالحاً أو اتركه فارغاً"));
      return;
    }
    const dPctRaw = editDiscountPercent.trim();
    let dPct: number | null = null;
    if (dPctRaw) {
      const n = parseFloat(dPctRaw.replace(",", "."));
      if (Number.isNaN(n) || n < 0 || n > 100) {
        setError(t(`${Su}.invalidDiscountPercent`, "نسبة الخصم يجب أن تكون بين 0 و 100"));
        return;
      }
      dPct = n;
    }
    setEditLoading(true);
    const res = await fetch(`/api/dashboard/subscription-plans/${encodeURIComponent(editingId)}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        description: editDescription.trim(),
        durationKind: editDurationKind,
        durationValue:
          editDurationKind === "custom_days" ? Math.max(1, parseInt(editCustomDays, 10) || 30) : 1,
        price: p,
        discountPrice: dp ?? null,
        discountPercent: dPct,
        buttonText: editButtonText.trim() || null,
        accentColor: editAccentColor.trim() || null,
        badgeText: editBadgeText.trim() || null,
        featuresJson: editFeaturesJson.trim() || null,
        sortOrder: Math.max(0, parseInt(editSortOrder, 10) || 0),
        imageUrl: editImageUrl.trim() || null,
        isActive: editActive,
        coversCourses: editCoversCourses,
        coversLibrary: editCoversLibrary,
        coversExternalTraining: editCoversExternal,
        courseCategoryIds: editCoversCourses ? editCourseCategoryIds : [],
        libraryCategoryIds: editCoversLibrary ? editLibraryCategoryIds : [],
        externalTrainingIds: editCoversExternal ? editExternalTrainingIds : [],
      }),
    });
    const data = await res.json().catch(() => ({}));
    setEditLoading(false);
    if (!res.ok) {
      setError(data.error ?? t(`${Su}.updatePlanFailed`));
      return;
    }
    setSuccess(t(`${Su}.updatePlanSuccess`));
    closeEdit();
    await reloadPlans();
    router.refresh();
  }

  async function removePlan(row: AdminPlanRow) {
    const ok = window.confirm(fillMessage(t(`${Su}.confirmDeletePlan`), { name: row.name }));
    if (!ok) return;
    setError("");
    setSuccess("");
    const res = await fetch(`/api/dashboard/subscription-plans/${encodeURIComponent(row.id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? t(`${Su}.deleteFailed`));
      return;
    }
    setSuccess(t(`${Su}.deleteSuccess`));
    if (editingId === row.id) closeEdit();
    await reloadPlans();
    router.refresh();
  }

  async function toggleRowActive(row: AdminPlanRow, next: boolean) {
    setError("");
    const res = await fetch(`/api/dashboard/subscription-plans/${encodeURIComponent(row.id)}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? t(`${Su}.toggleFailed`));
      return;
    }
    await reloadPlans();
    router.refresh();
  }

  async function onImageFile(file: File | undefined, which: "create" | "edit") {
    if (!file) return;
    const setUploading = which === "create" ? setImageUploading : setEditImageUploading;
    const setErr = which === "create" ? setImageError : setEditImageError;
    const setUrl = which === "create" ? setImageUrl : setEditImageUrl;
    setErr("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/upload/image", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) setUrl(data.url);
      else {
        const msg = data.missing?.length ? `${data.error} ${data.missing.join(", ")}` : data.error || t(`${Su}.uploadFailed`);
        setErr(msg);
      }
    } catch {
      setErr(t(`${Su}.connectionFailed`));
    } finally {
      setUploading(false);
    }
  }

  function priceCell(row: AdminPlanRow) {
    const pricing = resolveSubscriptionPlanPricing({
      price: row.price,
      discountPrice: row.discountPrice,
      discountPercent: row.discountPercent,
    });
    if (!pricing.hasDiscount) {
      return (
        <span className="tabular-nums">
          {Number(pricing.chargePrice).toFixed(2)} {egp}
        </span>
      );
    }
    return (
      <span className="flex flex-col gap-0.5">
        <span className="tabular-nums font-semibold">
          {Number(pricing.chargePrice).toFixed(2)} {egp}
        </span>
        <span className="tabular-nums text-xs text-[var(--color-muted)] line-through">
          {Number(pricing.compareAtPrice).toFixed(2)} {egp}
        </span>
        {pricing.discountPercent != null ? (
          <span className="text-xs text-[var(--color-primary)]">
            {t(`${Su}.discountBadge`, "خصم {percent}%").replace("{percent}", String(pricing.discountPercent))}
          </span>
        ) : null}
      </span>
    );
  }

  const fieldClass =
    "mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-[var(--color-foreground)]";
  const labelClass = "block text-sm font-medium text-[var(--color-foreground)]";

  function renderPricingFields(opts: {
    price: string;
    setPrice: (v: string) => void;
    discountPrice: string;
    setDiscountPrice: (v: string) => void;
    discountPercent: string;
    setDiscountPercent: (v: string) => void;
    buttonText: string;
    setButtonText: (v: string) => void;
    accentColor: string;
    setAccentColor: (v: string) => void;
    badgeText: string;
    setBadgeText: (v: string) => void;
    featuresJson: string;
    setFeaturesJson: (v: string) => void;
    sortOrder: string;
    setSortOrder: (v: string) => void;
  }) {
    return (
      <>
        <div>
          <label className={labelClass}>{t(`${Su}.labelFeatures`, "مميزات الباقة")}</label>
          <textarea
            value={opts.featuresJson}
            onChange={(e) => opts.setFeaturesJson(e.target.value)}
            rows={5}
            placeholder={t(
              `${Su}.featuresPlaceholder`,
              "+ وصول لمعظم الكورسات الأساسية\n+ شهادات معتمدة\n- ملفات للتحميل\n- كورسات متقدمة",
            )}
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {t(
              `${Su}.featuresHint`,
              "سطر لكل ميزة. ابدأ بـ + للمتضمنة و - لغير المتضمنة.",
            )}
          </p>
        </div>
        <div>
          <label className={labelClass}>{t(`${Su}.labelBasePrice`, "السعر الأساسي (ج.م)")}</label>
          <input
            required
            type="text"
            inputMode="decimal"
            value={opts.price}
            onChange={(e) => opts.setPrice(e.target.value)}
            className={fieldClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t(`${Su}.labelDiscountPrice`, "سعر الخصم (اختياري)")}</label>
            <input
              type="text"
              inputMode="decimal"
              value={opts.discountPrice}
              onChange={(e) => opts.setDiscountPrice(e.target.value)}
              placeholder={t(`${Su}.discountPricePlaceholder`, "مثال: 999")}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t(`${Su}.labelDiscountPercent`, "نسبة الخصم % (اختياري)")}</label>
            <input
              type="text"
              inputMode="decimal"
              value={opts.discountPercent}
              onChange={(e) => opts.setDiscountPercent(e.target.value)}
              placeholder={t(`${Su}.discountPercentPlaceholder`, "مثال: 40")}
              className={fieldClass}
            />
          </div>
        </div>
        <p className="text-xs text-[var(--color-muted)]">
          {t(
            `${Su}.discountHint`,
            "إذا أدخلت سعر خصم أقل من الأساسي يظهر مشطوباً مع نسبة/قيمة التوفير. اترك الحقول فارغة لعرض السعر فقط.",
          )}
        </p>
        <div>
          <label className={labelClass}>{t(`${Su}.labelButtonText`, "نص زر الاشتراك")}</label>
          <input
            type="text"
            value={opts.buttonText}
            onChange={(e) => opts.setButtonText(e.target.value)}
            placeholder={DEFAULT_BUTTON}
            className={fieldClass}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {["اشترك الآن", "ابدأ الآن", "اختر الخطة", "ترقية الاشتراك", "اشترِ الآن"].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => opts.setButtonText(label)}
                className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>{t(`${Su}.labelBadge`, "شارة الباقة (اختياري)")}</label>
          <input
            type="text"
            value={opts.badgeText}
            onChange={(e) => opts.setBadgeText(e.target.value)}
            placeholder={t(`${Su}.badgePlaceholder`, "الأكثر شيوعًا — الأفضل قيمة — عرض خاص")}
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass}>{t(`${Su}.labelAccentColor`, "لون الباقة")}</label>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <input
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(opts.accentColor) ? opts.accentColor : "#0f766e"}
              onChange={(e) => opts.setAccentColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-[var(--color-border)] bg-transparent"
            />
            <input
              type="text"
              value={opts.accentColor}
              onChange={(e) => opts.setAccentColor(e.target.value)}
              className={`${fieldClass} mt-0 max-w-[10rem]`}
              placeholder="#0f766e"
            />
            <div className="flex flex-wrap gap-1.5">
              {ACCENT_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => opts.setAccentColor(c)}
                  className="h-7 w-7 rounded-full border border-black/10"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className={labelClass}>{t(`${Su}.labelSortOrder`, "ترتيب العرض")}</label>
          <input
            type="number"
            min={0}
            value={opts.sortOrder}
            onChange={(e) => opts.setSortOrder(e.target.value)}
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {t(`${Su}.sortOrderHint`, "الأرقام الأصغر تظهر أولاً.")}
          </p>
        </div>
      </>
    );
  }

  return (
    <div className="space-y-8" dir={dir}>
      <div>
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">{t(`${Su}.pageTitle`)}</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{t(`${Su}.pageIntro`)}</p>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{t(`${Su}.visibilityTitle`)}</h3>
        <p className="mt-2 text-sm text-[var(--color-muted)]">{t(`${Su}.visibilityIntro`)}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button
            type="button"
            disabled={toggleLoading || enabled}
            onClick={() => void patchEnabled(true)}
            className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {t(`${Su}.enableFeature`)}
          </button>
          <button
            type="button"
            disabled={toggleLoading || !enabled}
            onClick={() => void patchEnabled(false)}
            className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-border)]/40 disabled:opacity-50"
          >
            {t(`${Su}.disableFeature`)}
          </button>
          <span className="text-sm text-[var(--color-muted)]">{enabled ? t(`${Su}.statusOn`) : t(`${Su}.statusOff`)}</span>
        </div>
      </div>

      {error ? (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-[var(--radius-btn)] bg-[var(--color-primary)]/10 px-3 py-2 text-sm text-[var(--color-primary)]">{success}</div>
      ) : null}

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{t(`${Su}.addPlanTitle`)}</h3>
        <form onSubmit={(e) => void createPlan(e)} className="mt-4 grid max-w-2xl gap-4">
          <div>
            <label className={labelClass}>{t(`${Su}.labelName`)}</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>{t(`${Su}.labelDuration`)}</label>
            <select
              value={durationKind}
              onChange={(e) => {
                const next = normalizeSubscriptionDurationKind(e.target.value);
                if (next) setDurationKind(next);
              }}
              className={fieldClass}
            >
              {SUBSCRIPTION_DURATION_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {subscriptionDurationLabel(kind, t)}
                </option>
              ))}
            </select>
          </div>
          {durationKind === "custom_days" ? (
            <div>
              <label className={labelClass}>{t(`${Su}.customDays`, "Number of days")}</label>
              <input
                type="number"
                min={1}
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                className={fieldClass}
              />
            </div>
          ) : null}
          <div className="space-y-3 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={coversCourses} onChange={(e) => setCoversCourses(e.target.checked)} />
              {t(`${Su}.coversCourses`, "Courses")}
            </label>
            <CoverageMultiSelect
              label={t(`${Su}.selectCourseCategories`, "Select course categories")}
              options={courseCategoryOptions}
              selected={courseCategoryIds}
              onChange={setCourseCategoryIds}
              disabled={!coversCourses}
            />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={coversLibrary} onChange={(e) => setCoversLibrary(e.target.checked)} />
              {t(`${Su}.coversLibrary`, "Library")}
            </label>
            <CoverageMultiSelect
              label={t(`${Su}.selectLibraryCategories`, "Select library categories")}
              options={libraryCategoryOptions}
              selected={libraryCategoryIds}
              onChange={setLibraryCategoryIds}
              disabled={!coversLibrary}
            />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={coversExternal} onChange={(e) => setCoversExternal(e.target.checked)} />
              {t(`${Su}.coversExternal`, "External training")}
            </label>
            <CoverageMultiSelect
              label={t(`${Su}.selectExternalPages`, "Select external training pages")}
              options={externalTrainingOptions}
              selected={externalTrainingIds}
              onChange={setExternalTrainingIds}
              disabled={!coversExternal}
            />
          </div>
          {renderPricingFields({
            price,
            setPrice,
            discountPrice,
            setDiscountPrice,
            discountPercent,
            setDiscountPercent,
            buttonText,
            setButtonText,
            accentColor,
            setAccentColor,
            badgeText,
            setBadgeText,
            featuresJson,
            setFeaturesJson,
            sortOrder,
            setSortOrder,
          })}
          <div>
            <label className={labelClass}>{t(`${Su}.labelDescription`)}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={fieldClass}
            />
          </div>
          <div>
            <span className={labelClass}>{t(`${Su}.packageImageOptional`)}</span>
            {imageUrl ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="h-24 max-w-xs rounded-lg border border-[var(--color-border)] object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl("");
                    setImageError("");
                  }}
                  className="text-sm text-red-600 hover:underline dark:text-red-400"
                >
                  {t(`${Su}.removeImage`)}
                </button>
              </div>
            ) : null}
            <label className="mt-2 inline-flex cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--color-border)]/50">
              {imageUploading ? t(`${Su}.uploadImageBusy`) : t(`${Su}.uploadImageIdle`)}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={imageUploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  void onImageFile(f, "create");
                  e.target.value = "";
                }}
              />
            </label>
            {imageError ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{imageError}</p> : null}
          </div>
          <button
            type="submit"
            disabled={formLoading}
            className="w-fit rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
          >
            {formLoading ? t(`${Su}.savePlanBusy`) : t(`${Su}.savePlanIdle`)}
          </button>
        </form>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{t(`${Su}.currentPlansTitle`)}</h3>
        <div className="mt-4 overflow-x-auto" dir={dir}>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
                <th className={thClass}>{t(`${Su}.colImage`)}</th>
                <th className={thClass}>{t(`${Su}.colName`)}</th>
                <th className={thClass}>{t(`${Su}.colDuration`)}</th>
                <th className={thClass}>{t(`${Su}.colPrice`)}</th>
                <th className={thClass}>{t(`${Su}.colBadge`, "الشارة")}</th>
                <th className={thClass}>{t(`${Su}.colSort`, "الترتيب")}</th>
                <th className={thClass}>{t(`${Su}.colActive`)}</th>
                <th className={thClass}>{t(`${Su}.colActions`)}</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[var(--color-muted)]">
                    {t(`${Su}.emptyPlans`)}
                  </td>
                </tr>
              ) : (
                plans.map((row) => (
                  <tr key={row.id} className="border-b border-[var(--color-border)]/60">
                    <td className="px-3 py-2">
                      {row.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.imageUrl} alt="" className="h-10 w-14 rounded object-cover ring-1 ring-[var(--color-border)]" />
                      ) : (
                        <span className="text-[var(--color-muted)]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 font-medium">
                        {row.accentColor ? (
                          <span
                            className="inline-block h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10"
                            style={{ backgroundColor: row.accentColor }}
                          />
                        ) : null}
                        {row.name}
                      </div>
                      {row.buttonText ? (
                        <div className="mt-0.5 text-xs text-[var(--color-muted)]">{row.buttonText}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-muted)]">{dkLabel(row.durationKind)}</td>
                    <td className="px-3 py-2">{priceCell(row)}</td>
                    <td className="px-3 py-2 text-[var(--color-muted)]">{row.badgeText?.trim() || "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{row.sortOrder ?? 0}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => void toggleRowActive(row, !row.isActive)}
                        className="text-xs text-[var(--color-primary)] underline"
                      >
                        {row.isActive ? t(`${Su}.toggleHide`) : t(`${Su}.toggleShow`)}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-border)]/40"
                        >
                          {t(`${Su}.edit`)}
                        </button>
                        <button
                          type="button"
                          onClick={() => void removePlan(row)}
                          className="rounded-[var(--radius-btn)] border border-red-500/40 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10 dark:text-red-400"
                        >
                          {t(`${Su}.delete`)}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="edit-plan-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="edit-plan-title" className="text-lg font-semibold text-[var(--color-foreground)]">
              {t(`${Su}.editPlanTitle`)}
            </h3>
            <form onSubmit={(e) => void submitEdit(e)} className="mt-4 space-y-4">
              <div>
                <label className={labelClass}>{t(`${Su}.labelName`)}</label>
                <input required value={editName} onChange={(e) => setEditName(e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label className={labelClass}>{t(`${Su}.labelDuration`)}</label>
                <select
                  value={normalizeSubscriptionDurationKind(editDurationKind) ?? "month"}
                  onChange={(e) => {
                    const next = normalizeSubscriptionDurationKind(e.target.value);
                    if (next) setEditDurationKind(next);
                  }}
                  className={fieldClass}
                >
                  {SUBSCRIPTION_DURATION_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {subscriptionDurationLabel(kind, t)}
                    </option>
                  ))}
                </select>
              </div>
              {editDurationKind === "custom_days" ? (
                <div>
                  <label className={labelClass}>{t(`${Su}.customDays`, "Number of days")}</label>
                  <input
                    type="number"
                    min={1}
                    value={editCustomDays}
                    onChange={(e) => setEditCustomDays(e.target.value)}
                    className={fieldClass}
                  />
                </div>
              ) : null}
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editCoversCourses}
                    onChange={(e) => setEditCoversCourses(e.target.checked)}
                  />
                  {t(`${Su}.coversCourses`, "Courses")}
                </label>
                <CoverageMultiSelect
                  label={t(`${Su}.selectCourseCategories`, "Select course categories")}
                  options={courseCategoryOptions}
                  selected={editCourseCategoryIds}
                  onChange={setEditCourseCategoryIds}
                  disabled={!editCoversCourses}
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editCoversLibrary}
                    onChange={(e) => setEditCoversLibrary(e.target.checked)}
                  />
                  {t(`${Su}.coversLibrary`, "Library")}
                </label>
                <CoverageMultiSelect
                  label={t(`${Su}.selectLibraryCategories`, "Select library categories")}
                  options={libraryCategoryOptions}
                  selected={editLibraryCategoryIds}
                  onChange={setEditLibraryCategoryIds}
                  disabled={!editCoversLibrary}
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editCoversExternal}
                    onChange={(e) => setEditCoversExternal(e.target.checked)}
                  />
                  {t(`${Su}.coversExternal`, "External training")}
                </label>
                <CoverageMultiSelect
                  label={t(`${Su}.selectExternalPages`, "Select external training pages")}
                  options={externalTrainingOptions}
                  selected={editExternalTrainingIds}
                  onChange={setEditExternalTrainingIds}
                  disabled={!editCoversExternal}
                />
              </div>
              {renderPricingFields({
                price: editPrice,
                setPrice: setEditPrice,
                discountPrice: editDiscountPrice,
                setDiscountPrice: setEditDiscountPrice,
                discountPercent: editDiscountPercent,
                setDiscountPercent: setEditDiscountPercent,
                buttonText: editButtonText,
                setButtonText: setEditButtonText,
                accentColor: editAccentColor,
                setAccentColor: setEditAccentColor,
                badgeText: editBadgeText,
                setBadgeText: setEditBadgeText,
                featuresJson: editFeaturesJson,
                setFeaturesJson: setEditFeaturesJson,
                sortOrder: editSortOrder,
                setSortOrder: setEditSortOrder,
              })}
              <div className="flex items-center gap-2">
                <input
                  id="edit-plan-active"
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--color-border)]"
                />
                <label htmlFor="edit-plan-active" className="text-sm text-[var(--color-foreground)]">
                  {t(`${Su}.activeCheckbox`)}
                </label>
              </div>
              <div>
                <label className={labelClass}>{t(`${Su}.labelDescEdit`)}</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className={fieldClass}
                />
              </div>
              <div>
                <span className={labelClass}>{t(`${Su}.packageImageOptional`)}</span>
                {editImageUrl ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={editImageUrl} alt="" className="h-24 max-w-xs rounded-lg border border-[var(--color-border)] object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setEditImageUrl("");
                        setEditImageError("");
                      }}
                      className="text-sm text-red-600 hover:underline dark:text-red-400"
                    >
                      {t(`${Su}.removeImage`)}
                    </button>
                  </div>
                ) : null}
                <label className="mt-2 inline-flex cursor-pointer rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium transition hover:bg-[var(--color-border)]/50">
                  {editImageUploading ? t(`${Su}.uploadImageEditBusy`) : t(`${Su}.uploadImageEditIdle`)}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    disabled={editImageUploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      void onImageFile(f, "edit");
                      e.target.value = "";
                    }}
                  />
                </label>
                {editImageError ? <p className="mt-1 text-sm text-red-600 dark:text-red-400">{editImageError}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                >
                  {editLoading ? t(`${Su}.saveBusy`) : t(`${Su}.saveIdle`)}
                </button>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-border)]/40"
                >
                  {t(`${Su}.cancel`)}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
