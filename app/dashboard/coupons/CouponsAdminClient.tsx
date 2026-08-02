"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/LocaleProvider";
import { useDashboardTable, dateLocaleForUi } from "@/lib/i18n/dashboard-table";
import { fillMessage } from "@/lib/i18n/interpolate";
import type { CouponScope, CouponTargetType, DiscountCoupon } from "@/lib/lms-features-db";

type OptionRow = { id: string; title: string };
type PlanOptionRow = { id: string; name: string };

type Props = {
  initialCoupons: DiscountCoupon[];
  courseOptions: OptionRow[];
  planOptions: PlanOptionRow[];
  storeOptions: OptionRow[];
};

function formatValidity(
  startsAt: string | null,
  expiresAt: string | null,
  t: (key: string, fallback?: string) => string,
  C: string,
  dateLocale: string,
): string {
  const dash = t("dashboard.studentsPage.dash", "—");
  if (!startsAt && !expiresAt) return t(`${C}.validityAlways`, "Always valid");
  const fmt = (iso: string) => new Date(iso).toLocaleString(dateLocale);
  if (startsAt && expiresAt) {
    return fillMessage(t(`${C}.validityRange`, "{from} → {to}"), {
      from: fmt(startsAt),
      to: fmt(expiresAt),
    });
  }
  if (startsAt) {
    return fillMessage(t(`${C}.validityFrom`, "From {date}"), { date: fmt(startsAt) });
  }
  return fillMessage(t(`${C}.validityUntil`, "Until {date}"), { date: fmt(expiresAt!) });
}

function discountLabel(coupon: DiscountCoupon, egp: string): string {
  if (coupon.discountType === "percent") return `${coupon.amount}%`;
  return `${coupon.amount} ${egp}`;
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename: string, rows: string[][]) {
  const bom = "\uFEFF";
  const body = rows.map((r) => r.map(escapeCsvCell).join(",")).join("\n");
  const blob = new Blob([bom + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function scopeSupportsSpecificTargets(scope: CouponScope): boolean {
  return scope === "course" || scope === "subscription" || scope === "store" || scope === "library" || scope === "all";
}

function CheckboxGroup({
  label,
  items,
  selected,
  onToggle,
  onSelectAll,
  onClear,
  selectAllLabel,
  clearLabel,
  selectedCountLabel,
}: {
  label: string;
  items: { id: string; label: string }[];
  selected: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  onSelectAll: () => void;
  onClear: () => void;
  selectAllLabel: string;
  clearLabel: string;
  selectedCountLabel: string;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="mb-1 text-xs font-semibold text-[var(--color-foreground)]">{label}</p>
      <div className="max-h-36 space-y-1 overflow-auto pr-1">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-[var(--color-border)]/30"
          >
            <input
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={(e) => onToggle(item.id, e.target.checked)}
              className="rounded border-[var(--color-border)]"
            />
            <span className="truncate" title={item.label}>
              {item.label}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSelectAll}
          className="rounded border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-border)]/30"
        >
          {selectAllLabel}
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded border border-[var(--color-border)] px-2 py-1 text-xs hover:bg-[var(--color-border)]/30"
        >
          {clearLabel}
        </button>
        {selected.size > 0 ? (
          <span className="text-xs text-[var(--color-muted)]">{selectedCountLabel}</span>
        ) : null}
      </div>
    </div>
  );
}

export function CouponsAdminClient({
  initialCoupons,
  courseOptions,
  planOptions,
  storeOptions,
}: Props) {
  const router = useRouter();
  const t = useT();
  const C = "dashboard.coupons";
  const egp = t("common.egyptianPoundShort", "EGP");
  const { locale, dir, thClassCompact } = useDashboardTable();
  const dateLocale = dateLocaleForUi(locale);
  const dash = t("dashboard.studentsPage.dash", "—");

  const [coupons, setCoupons] = useState(initialCoupons);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const [campaignName, setCampaignName] = useState("");
  const [code, setCode] = useState("");
  const [batchCount, setBatchCount] = useState(1);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [amount, setAmount] = useState("");
  const [scope, setScope] = useState<CouponScope>("course");
  const [targetMode, setTargetMode] = useState<"all_in_scope" | "specific">("all_in_scope");
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
  const [selectedPlanIds, setSelectedPlanIds] = useState<Set<string>>(new Set());
  const [selectedStoreIds, setSelectedStoreIds] = useState<Set<string>>(new Set());
  const [usageMode, setUsageMode] = useState<"unlimited" | "fixed">("unlimited");
  const [maxUses, setMaxUses] = useState("100");
  const [maxUsesPerUser, setMaxUsesPerUser] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setCoupons(initialCoupons);
  }, [initialCoupons]);

  const reload = useCallback(async () => {
    const r = await fetch("/api/dashboard/coupons", { credentials: "include" });
    if (!r.ok) return;
    const d = (await r.json()) as { coupons?: DiscountCoupon[] };
    if (d.coupons) setCoupons(d.coupons);
  }, []);

  const scopeLabel = useCallback(
    (s: CouponScope): string => {
      if (s === "course") return t(`${C}.scopeCourse`, "Courses");
      if (s === "library") return t(`${C}.scopeLibrary`, "Library");
      if (s === "subscription") return t(`${C}.scopeSubscription`, "Subscriptions");
      if (s === "store") return t(`${C}.scopeStore`, "Store");
      if (s === "all") return t(`${C}.scopeAll`, "All purchases");
      return s;
    },
    [t],
  );

  const targetSummary = useCallback(
    (coupon: DiscountCoupon): string => {
      if (coupon.targetMode !== "specific" || coupon.targets.length === 0) {
        return t(`${C}.targetAllInScope`, "All in scope");
      }
      const names: string[] = [];
      for (const target of coupon.targets) {
        if (target.targetType === "course") {
          const c = courseOptions.find((o) => o.id === target.targetId);
          if (c) names.push(c.title);
        } else if (target.targetType === "subscription_plan") {
          const p = planOptions.find((o) => o.id === target.targetId);
          if (p) names.push(p.name);
        } else if (target.targetType === "store_product") {
          const s = storeOptions.find((o) => o.id === target.targetId);
          if (s) names.push(s.title);
        }
      }
      if (names.length === 0) {
        return fillMessage(t(`${C}.targetSpecificCount`, "{count} specific"), {
          count: coupon.targets.length,
        });
      }
      if (names.length <= 2) return names.join(", ");
      return fillMessage(t(`${C}.targetSpecificCount`, "{count} specific"), { count: names.length });
    },
    [courseOptions, planOptions, storeOptions, t],
  );

  const filteredCoupons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return coupons;
    return coupons.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        (c.campaignName ?? "").toLowerCase().includes(q) ||
        scopeLabel(c.scope).toLowerCase().includes(q),
    );
  }, [coupons, searchQuery, scopeLabel]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredCoupons.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredCoupons.map((c) => c.id)));
  }

  function buildTargets(): Array<{ targetType: CouponTargetType; targetId: string }> {
    const out: Array<{ targetType: CouponTargetType; targetId: string }> = [];
    if (scope === "course" || scope === "all") {
      selectedCourseIds.forEach((id) => out.push({ targetType: "course", targetId: id }));
    }
    if (scope === "subscription" || scope === "all") {
      selectedPlanIds.forEach((id) => out.push({ targetType: "subscription_plan", targetId: id }));
    }
    if (scope === "store" || scope === "library" || scope === "all") {
      selectedStoreIds.forEach((id) => out.push({ targetType: "store_product", targetId: id }));
    }
    return out;
  }

  function resetForm() {
    setCampaignName("");
    setCode("");
    setBatchCount(1);
    setDiscountType("percent");
    setAmount("");
    setScope("course");
    setTargetMode("all_in_scope");
    setSelectedCourseIds(new Set());
    setSelectedPlanIds(new Set());
    setSelectedStoreIds(new Set());
    setUsageMode("unlimited");
    setMaxUses("100");
    setMaxUsesPerUser("");
    setStartsAt("");
    setExpiresAt("");
    setIsActive(true);
  }

  function showCourseTargets(): boolean {
    return targetMode === "specific" && (scope === "course" || scope === "all");
  }

  function showPlanTargets(): boolean {
    return targetMode === "specific" && (scope === "subscription" || scope === "all");
  }

  function showStoreTargets(): boolean {
    return targetMode === "specific" && (scope === "store" || scope === "library" || scope === "all");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const batch = Math.min(200, Math.max(1, batchCount || 1));
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError(t(`${C}.invalidAmount`, "Enter a valid discount amount greater than zero."));
      return;
    }
    if (discountType === "percent" && amt > 100) {
      setError(t(`${C}.invalidPercent`, "Percent discount cannot exceed 100%."));
      return;
    }
    if (batch === 1 && code.trim() && code.trim().length < 3) {
      setError(t(`${C}.invalidCode`, "Coupon code must be at least 3 characters, or leave empty to auto-generate."));
      return;
    }
    if (usageMode === "fixed") {
      const mu = Number(maxUses);
      if (!Number.isFinite(mu) || mu < 1) {
        setError(t(`${C}.invalidMaxUses`, "Enter a valid maximum uses count (at least 1)."));
        return;
      }
    }
    const targets = targetMode === "specific" ? buildTargets() : [];
    if (targetMode === "specific" && scopeSupportsSpecificTargets(scope) && targets.length === 0) {
      setError(t(`${C}.pickTargets`, "Select at least one target when using specific targeting."));
      return;
    }

    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        campaignName: campaignName.trim() || null,
        discountType,
        amount: amt,
        scope,
        targetMode,
        targets,
        usageMode,
        maxUses: usageMode === "fixed" ? Number(maxUses) : null,
        maxUsesPerUser: maxUsesPerUser.trim() ? Number(maxUsesPerUser) : null,
        startsAt: startsAt.trim() || null,
        expiresAt: expiresAt.trim() || null,
        isActive,
        batchCount: batch,
      };
      if (batch === 1 && code.trim()) body.code = code.trim();

      const r = await fetch("/api/dashboard/coupons", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((d as { error?: string }).error ?? t(`${C}.createFailed`, "Failed to create coupon(s)."));

      setSuccess(
        fillMessage(t(`${C}.createSuccess`, "Created {count} coupon(s) successfully."), {
          count: (d as { count?: number }).count ?? batch,
        }),
      );
      resetForm();
      await reload();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(`${C}.createFailed`, "Failed to create coupon(s)."));
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(coupon: DiscountCoupon) {
    setTogglingIds((prev) => new Set(prev).add(coupon.id));
    try {
      await fetch(`/api/dashboard/coupons/${coupon.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      await reload();
    } finally {
      setTogglingIds((prev) => {
        const next = new Set(prev);
        next.delete(coupon.id);
        return next;
      });
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t(`${C}.confirmDelete`, "Delete this coupon? This cannot be undone."))) return;
    setDeletingIds((prev) => new Set(prev).add(id));
    try {
      await fetch(`/api/dashboard/coupons/${id}`, { method: "DELETE", credentials: "include" });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      await reload();
      router.refresh();
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  function copyCode(coupon: DiscountCoupon) {
    navigator.clipboard.writeText(coupon.code).then(
      () => {
        setCopySuccessId(coupon.id);
        setTimeout(() => setCopySuccessId(null), 2000);
      },
      () => setError(t(`${C}.copyFailed`, "Could not copy to clipboard.")),
    );
  }

  function exportCoupons(list: DiscountCoupon[]) {
    if (list.length === 0) {
      setError(t(`${C}.nothingToExport`, "No coupons to export."));
      return;
    }
    const headers = [
      t(`${C}.csvCode`, "Code"),
      t(`${C}.csvCampaign`, "Campaign"),
      t(`${C}.csvDiscountType`, "Discount type"),
      t(`${C}.csvAmount`, "Amount"),
      t(`${C}.csvScope`, "Scope"),
      t(`${C}.csvTargetMode`, "Target mode"),
      t(`${C}.csvUsed`, "Used"),
      t(`${C}.csvMaxUses`, "Max uses"),
      t(`${C}.csvMaxPerUser`, "Max per user"),
      t(`${C}.csvStarts`, "Starts"),
      t(`${C}.csvExpires`, "Expires"),
      t(`${C}.csvActive`, "Active"),
    ];
    const rows = list.map((c) => [
      c.code,
      c.campaignName ?? "",
      c.discountType,
      c.amount,
      c.scope,
      c.targetMode,
      c.usedCount,
      c.maxUses ?? "",
      c.maxUsesPerUser ?? "",
      c.startsAt ?? "",
      c.expiresAt ?? "",
      c.isActive ? "yes" : "no",
    ].map(String));
    downloadCsv(`coupons-${new Date().toISOString().slice(0, 10)}.csv`, [headers, ...rows]);
  }

  const inputClass =
    "mt-1 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm";
  const labelClass = "block text-sm font-medium text-[var(--color-foreground)]";

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-foreground)]">
        {t(
          `${C}.intro`,
          "Coupons reduce price at checkout. For free access use Activation Codes.",
        )}{" "}
        <Link href="/dashboard/codes" className="font-medium text-[var(--color-primary)] hover:underline">
          {t(`${C}.introLink`, "Activation Codes →")}
        </Link>
      </div>

      {error ? (
        <div className="rounded-[var(--radius-btn)] bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-[var(--radius-btn)] bg-green-500/10 px-3 py-2 text-sm text-green-600 dark:text-green-400">
          {success}
        </div>
      ) : null}

      <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
          {t(`${C}.sectionCreate`, "Create coupon(s)")}
        </h3>
        <form onSubmit={(e) => void handleCreate(e)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass}>{t(`${C}.labelCampaignName`, "Campaign name (optional)")}</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder={t(`${C}.campaignPlaceholder`, "Summer sale")}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t(`${C}.labelBatchCount`, "Batch count")}</label>
              <input
                type="number"
                min={1}
                max={200}
                value={batchCount}
                onChange={(e) => setBatchCount(Number(e.target.value) || 1)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                {t(`${C}.labelCode`, "Code")}
                {batchCount > 1 ? (
                  <span className="ms-1 text-xs font-normal text-[var(--color-muted)]">
                    ({t(`${C}.codeAutoHint`, "auto-generated for batches")})
                  </span>
                ) : null}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={batchCount > 1}
                placeholder={t(`${C}.codePlaceholder`, "Leave empty to auto-generate")}
                className={`${inputClass} font-mono uppercase disabled:opacity-50`}
              />
            </div>
            <div>
              <label className={labelClass}>{t(`${C}.labelDiscountType`, "Discount type")}</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}
                className={inputClass}
              >
                <option value="percent">{t(`${C}.discountPercent`, "Percent (%)")}</option>
                <option value="fixed">{t(`${C}.discountFixed`, "Fixed amount")}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>
                {t(`${C}.labelAmount`, "Amount")}
                {discountType === "percent" ? " (%)" : ` (${egp})`}
              </label>
              <input
                type="number"
                min={0}
                step={discountType === "percent" ? 1 : 0.01}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>{t(`${C}.labelScope`, "Scope")}</label>
              <select
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value as CouponScope);
                  setSelectedCourseIds(new Set());
                  setSelectedPlanIds(new Set());
                  setSelectedStoreIds(new Set());
                }}
                className={inputClass}
              >
                <option value="course">{t(`${C}.scopeCourse`, "Courses")}</option>
                <option value="library">{t(`${C}.scopeLibrary`, "Library")}</option>
                <option value="subscription">{t(`${C}.scopeSubscription`, "Subscriptions")}</option>
                <option value="store">{t(`${C}.scopeStore`, "Store")}</option>
                <option value="all">{t(`${C}.scopeAll`, "All purchases")}</option>
              </select>
            </div>
          </div>

          {scopeSupportsSpecificTargets(scope) ? (
            <div>
              <label className={labelClass}>{t(`${C}.labelTargetMode`, "Applies to")}</label>
              <div className="mt-2 flex flex-wrap gap-4">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="targetMode"
                    checked={targetMode === "all_in_scope"}
                    onChange={() => setTargetMode("all_in_scope")}
                    className="border-[var(--color-border)]"
                  />
                  {t(`${C}.targetAllInScope`, "All in scope")}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="targetMode"
                    checked={targetMode === "specific"}
                    onChange={() => setTargetMode("specific")}
                    className="border-[var(--color-border)]"
                  />
                  {t(`${C}.targetSpecific`, "Specific items only")}
                </label>
              </div>
              {targetMode === "specific" ? (
                <div className="mt-3 space-y-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
                  {showCourseTargets() ? (
                    <CheckboxGroup
                      label={t(`${C}.labelCourses`, "Courses")}
                      items={courseOptions.map((c) => ({ id: c.id, label: c.title }))}
                      selected={selectedCourseIds}
                      onToggle={(id, checked) => {
                        setSelectedCourseIds((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(id);
                          else next.delete(id);
                          return next;
                        });
                      }}
                      onSelectAll={() => setSelectedCourseIds(new Set(courseOptions.map((c) => c.id)))}
                      onClear={() => setSelectedCourseIds(new Set())}
                      selectAllLabel={t(`${C}.selectAll`, "Select all")}
                      clearLabel={t(`${C}.clearSelection`, "Clear")}
                      selectedCountLabel={fillMessage(t(`${C}.selectedCount`, "{count} selected"), {
                        count: selectedCourseIds.size,
                      })}
                    />
                  ) : null}
                  {showPlanTargets() ? (
                    <CheckboxGroup
                      label={t(`${C}.labelPlans`, "Subscription plans")}
                      items={planOptions.map((p) => ({ id: p.id, label: p.name }))}
                      selected={selectedPlanIds}
                      onToggle={(id, checked) => {
                        setSelectedPlanIds((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(id);
                          else next.delete(id);
                          return next;
                        });
                      }}
                      onSelectAll={() => setSelectedPlanIds(new Set(planOptions.map((p) => p.id)))}
                      onClear={() => setSelectedPlanIds(new Set())}
                      selectAllLabel={t(`${C}.selectAll`, "Select all")}
                      clearLabel={t(`${C}.clearSelection`, "Clear")}
                      selectedCountLabel={fillMessage(t(`${C}.selectedCount`, "{count} selected"), {
                        count: selectedPlanIds.size,
                      })}
                    />
                  ) : null}
                  {showStoreTargets() ? (
                    <CheckboxGroup
                      label={
                        scope === "library"
                          ? t(`${C}.labelLibraryProducts`, "Library products")
                          : t(`${C}.labelStoreProducts`, "Store products")
                      }
                      items={storeOptions.map((s) => ({ id: s.id, label: s.title }))}
                      selected={selectedStoreIds}
                      onToggle={(id, checked) => {
                        setSelectedStoreIds((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(id);
                          else next.delete(id);
                          return next;
                        });
                      }}
                      onSelectAll={() => setSelectedStoreIds(new Set(storeOptions.map((s) => s.id)))}
                      onClear={() => setSelectedStoreIds(new Set())}
                      selectAllLabel={t(`${C}.selectAll`, "Select all")}
                      clearLabel={t(`${C}.clearSelection`, "Clear")}
                      selectedCountLabel={fillMessage(t(`${C}.selectedCount`, "{count} selected"), {
                        count: selectedStoreIds.size,
                      })}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass}>{t(`${C}.labelUsageMode`, "Usage limit")}</label>
              <select
                value={usageMode}
                onChange={(e) => setUsageMode(e.target.value as "unlimited" | "fixed")}
                className={inputClass}
              >
                <option value="unlimited">{t(`${C}.usageUnlimited`, "Unlimited")}</option>
                <option value="fixed">{t(`${C}.usageFixed`, "Fixed total uses")}</option>
              </select>
            </div>
            {usageMode === "fixed" ? (
              <div>
                <label className={labelClass}>{t(`${C}.labelMaxUses`, "Max total uses")}</label>
                <input
                  type="number"
                  min={1}
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className={inputClass}
                />
              </div>
            ) : null}
            <div>
              <label className={labelClass}>
                {t(`${C}.labelMaxUsesPerUser`, "Max uses per user (optional)")}
              </label>
              <input
                type="number"
                min={1}
                value={maxUsesPerUser}
                onChange={(e) => setMaxUsesPerUser(e.target.value)}
                placeholder={t(`${C}.perUserUnlimited`, "Unlimited")}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t(`${C}.labelStartsAt`, "Starts at (optional)")}</label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t(`${C}.labelExpiresAt`, "Expires at (optional)")}</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-foreground)]">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-[var(--color-border)]"
              />
              {t(`${C}.labelActive`, "Active immediately")}
            </label>
            <button
              type="submit"
              disabled={creating}
              className="rounded-[var(--radius-btn)] bg-[var(--color-primary)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              {creating ? t(`${C}.creating`, "Creating…") : t(`${C}.createButton`, "Create coupon(s)")}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-background)]/50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              {fillMessage(t(`${C}.listTitle`, "Coupons ({count})"), { count: filteredCoupons.length })}
            </h3>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(`${C}.searchPlaceholder`, "Search code or campaign…")}
              className="min-w-[160px] max-w-[240px] rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => exportCoupons(coupons)}
              className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-background)]"
            >
              {t(`${C}.exportAll`, "Export all CSV")}
            </button>
            {selectedIds.size > 0 ? (
              <button
                type="button"
                onClick={() => exportCoupons(coupons.filter((c) => selectedIds.has(c.id)))}
                className="rounded-[var(--radius-btn)] border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-background)]"
              >
                {fillMessage(t(`${C}.exportSelected`, "Export selected ({count})"), { count: selectedIds.size })}
              </button>
            ) : null}
          </div>
        </div>

        {coupons.length === 0 ? (
          <p className="p-8 text-center text-[var(--color-muted)]">{t(`${C}.empty`, "No coupons yet.")}</p>
        ) : filteredCoupons.length === 0 ? (
          <p className="p-8 text-center text-[var(--color-muted)]">
            {t(`${C}.emptyFiltered`, "No coupons match your search.")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" dir={dir}>
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]/30">
                  <th className="p-2">
                    <input
                      type="checkbox"
                      checked={filteredCoupons.length > 0 && selectedIds.size === filteredCoupons.length}
                      onChange={toggleSelectAll}
                      className="rounded border-[var(--color-border)]"
                    />
                  </th>
                  <th className={thClassCompact}>{t(`${C}.colCode`, "Code")}</th>
                  <th className={thClassCompact}>{t(`${C}.colCampaign`, "Campaign")}</th>
                  <th className={thClassCompact}>{t(`${C}.colDiscount`, "Discount")}</th>
                  <th className={thClassCompact}>{t(`${C}.colScope`, "Scope")}</th>
                  <th className={thClassCompact}>{t(`${C}.colUses`, "Uses")}</th>
                  <th className={thClassCompact}>{t(`${C}.colPerUser`, "Per user")}</th>
                  <th className={thClassCompact}>{t(`${C}.colValidity`, "Validity")}</th>
                  <th className={thClassCompact}>{t(`${C}.colActive`, "Active")}</th>
                  <th className={thClassCompact}>{t(`${C}.colActions`, "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-[var(--color-border)]">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(coupon.id)}
                        onChange={() => toggleSelect(coupon.id)}
                        className="rounded border-[var(--color-border)]"
                      />
                    </td>
                    <td className="p-2 font-mono text-[var(--color-foreground)]">{coupon.code}</td>
                    <td className="p-2 text-[var(--color-muted)]">{coupon.campaignName ?? dash}</td>
                    <td className="p-2 text-[var(--color-foreground)]">{discountLabel(coupon, egp)}</td>
                    <td className="p-2 text-[var(--color-muted)]">
                      <span>{scopeLabel(coupon.scope)}</span>
                      <span className="mt-0.5 block text-xs">{targetSummary(coupon)}</span>
                    </td>
                    <td className="p-2 text-[var(--color-foreground)]">
                      {coupon.usedCount}/{coupon.usageMode === "fixed" && coupon.maxUses != null ? coupon.maxUses : "∞"}
                    </td>
                    <td className="p-2 text-[var(--color-muted)]">
                      {coupon.maxUsesPerUser ?? t(`${C}.perUserUnlimited`, "Unlimited")}
                    </td>
                    <td className="p-2 text-xs text-[var(--color-muted)]">
                      {formatValidity(coupon.startsAt, coupon.expiresAt, t, C, dateLocale)}
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        disabled={togglingIds.has(coupon.id)}
                        onClick={() => void toggleActive(coupon)}
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          coupon.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                            : "bg-[var(--color-muted)]/20 text-[var(--color-muted)]"
                        } disabled:opacity-50`}
                      >
                        {coupon.isActive
                          ? t(`${C}.statusActive`, "Active")
                          : t(`${C}.statusInactive`, "Inactive")}
                      </button>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyCode(coupon)}
                          className="text-[var(--color-primary)] hover:underline"
                        >
                          {copySuccessId === coupon.id
                            ? t(`${C}.copied`, "Copied!")
                            : t(`${C}.copyCode`, "Copy")}
                        </button>
                        <button
                          type="button"
                          disabled={deletingIds.has(coupon.id)}
                          onClick={() => void remove(coupon.id)}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          {deletingIds.has(coupon.id)
                            ? t(`${C}.deleting`, "Deleting…")
                            : t(`${C}.delete`, "Delete")}
                        </button>
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
