"use client";

import { useState } from "react";
import { useT } from "@/components/LocaleProvider";
import type { DiscountCoupon } from "@/lib/lms-features-db";

export function CouponsAdminClient({ initialCoupons }: { initialCoupons: DiscountCoupon[] }) {
  const t = useT();
  const [coupons, setCoupons] = useState(initialCoupons);
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState(0);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [scope, setScope] = useState<DiscountCoupon["scope"]>("course");
  const [usageMode, setUsageMode] = useState<DiscountCoupon["usageMode"]>("unlimited");
  const [maxUses, setMaxUses] = useState<number | null>(null);

  async function reload() {
    const r = await fetch("/api/dashboard/coupons");
    const d = await r.json();
    if (r.ok) setCoupons(d.coupons ?? []);
  }

  async function create() {
    const r = await fetch("/api/dashboard/coupons", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, amount, discountType, scope, usageMode, maxUses, isActive: true }),
    });
    if (r.ok) {
      setCode("");
      await reload();
    }
  }

  async function patch(id: string, data: object) {
    await fetch(`/api/dashboard/coupons/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await reload();
  }

  async function remove(id: string) {
    if (window.confirm(t("common.confirmDelete", "Delete this item?"))) {
      await fetch(`/api/dashboard/coupons/${id}`, { method: "DELETE", credentials: "include" });
      await reload();
    }
  }

  return (
    <div className="mt-6 space-y-5">
      <div className="flex flex-wrap gap-2 rounded border p-4">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CODE" className="rounded border px-3 py-2" />
        <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "percent" | "fixed")}>
          <option value="percent">Percent</option>
          <option value="fixed">Fixed</option>
        </select>
        <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="rounded border px-3 py-2" />
        <select value={scope} onChange={(e) => setScope(e.target.value as DiscountCoupon["scope"])}>
          <option value="course">Course</option>
          <option value="library">Library</option>
          <option value="subscription">Subscription</option>
        </select>
        <select value={usageMode} onChange={(e) => setUsageMode(e.target.value as DiscountCoupon["usageMode"])}>
          <option value="unlimited">Unlimited</option>
          <option value="fixed">Fixed</option>
        </select>
        {usageMode === "fixed" ? (
          <input type="number" min={1} value={maxUses ?? 1} onChange={(e) => setMaxUses(Number(e.target.value))} className="rounded border px-3 py-2" />
        ) : null}
        <button type="button" onClick={() => void create()} className="rounded bg-[var(--color-primary)] px-4 text-white">
          Create
        </button>
      </div>
      <div className="space-y-2">
        {coupons.map((coupon) => (
          <div key={coupon.id} className="flex justify-between rounded border p-4">
            <span>
              {coupon.code} · {coupon.amount}
              {coupon.discountType === "percent" ? "%" : ""} · {coupon.usedCount}/{coupon.maxUses ?? "∞"}
            </span>
            <span className="flex gap-3">
              <button type="button" onClick={() => void patch(coupon.id, { isActive: !coupon.isActive })} className="underline">
                {coupon.isActive ? "Deactivate" : "Activate"}
              </button>
              <button type="button" onClick={() => void remove(coupon.id)} className="text-red-600 underline">
                Delete
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
