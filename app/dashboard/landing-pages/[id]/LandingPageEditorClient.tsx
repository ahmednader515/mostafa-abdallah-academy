"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useT } from "@/components/LocaleProvider";
import {
  emptySection,
  newButtonId,
  newSectionId,
  type LandingCtaButton,
  type LandingCtaTargetType,
  type LandingPageStats,
  type LandingSection,
  type LandingSectionType,
  type LandingTheme,
} from "@/lib/landing-page-types";
import type { LandingPageRow } from "@/lib/landing-pages-db";

type TargetOption = { id: string; title?: string; name?: string; slug?: string; price?: number };
type TargetsPayload = {
  courses: TargetOption[];
  plans: TargetOption[];
  libraryPlans: TargetOption[];
  products: TargetOption[];
  consultations: TargetOption[];
};

type Tab = "content" | "design" | "link" | "seo";

const SECTION_TYPES: { type: LandingSectionType; labelAr: string; labelEn: string }[] = [
  { type: "hero", labelAr: "قسم رئيسي", labelEn: "Hero" },
  { type: "features", labelAr: "مميزات", labelEn: "Features" },
  { type: "details", labelAr: "تفاصيل", labelEn: "Details" },
  { type: "instructor", labelAr: "مدرس / مقدم", labelEn: "Instructor" },
  { type: "testimonials", labelAr: "آراء", labelEn: "Testimonials" },
  { type: "faq", labelAr: "أسئلة شائعة", labelEn: "FAQ" },
  { type: "pricing", labelAr: "أسعار", labelEn: "Pricing" },
  { type: "signup", labelAr: "تسجيل / شراء", labelEn: "Signup" },
];

function fieldClass() {
  return "w-full rounded border border-[var(--color-border)] px-3 py-2 text-sm";
}

function CtaButtonsEditor({
  buttons,
  onChange,
}: {
  buttons: LandingCtaButton[];
  onChange: (next: LandingCtaButton[]) => void;
}) {
  const t = useT();
  return (
    <div className="space-y-2 rounded border border-dashed p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">{t("landingPages.buttons", "Buttons")}</span>
        <button
          type="button"
          className="text-xs underline"
          onClick={() =>
            onChange([
              ...buttons,
              {
                id: newButtonId(),
                label: "اشترك الآن",
                labelEn: "Subscribe now",
                action: "target_default",
              },
            ])
          }
        >
          {t("landingPages.addButton", "Add button")}
        </button>
      </div>
      {buttons.map((btn, i) => (
        <div key={btn.id} className="grid gap-2 rounded border p-2 md:grid-cols-2">
          <input
            className={fieldClass()}
            value={btn.label}
            onChange={(e) => {
              const next = [...buttons];
              next[i] = { ...btn, label: e.target.value };
              onChange(next);
            }}
            placeholder={t("landingPages.buttonLabel", "Button label")}
          />
          <input
            className={fieldClass()}
            value={btn.color || ""}
            onChange={(e) => {
              const next = [...buttons];
              next[i] = { ...btn, color: e.target.value };
              onChange(next);
            }}
            placeholder={t("landingPages.buttonColor", "Button color (hex)")}
            dir="ltr"
          />
          <select
            className={fieldClass()}
            value={btn.action}
            onChange={(e) => {
              const next = [...buttons];
              next[i] = { ...btn, action: e.target.value as LandingCtaButton["action"] };
              onChange(next);
            }}
          >
            <option value="target_default">{t("landingPages.actionDefault", "Page default target")}</option>
            <option value="course">{t("landingPages.actionCourse", "Course")}</option>
            <option value="subscription">{t("landingPages.actionSubscription", "Subscription")}</option>
            <option value="library_plan">{t("landingPages.actionLibrary", "Library plan")}</option>
            <option value="consultation">{t("landingPages.actionConsultation", "Consultation")}</option>
            <option value="store_product">{t("landingPages.actionProduct", "Store product")}</option>
            <option value="custom_url">{t("landingPages.actionCustomUrl", "Custom URL")}</option>
            <option value="login">{t("landingPages.actionLogin", "Login only")}</option>
          </select>
          {btn.action === "custom_url" ? (
            <input
              className={fieldClass()}
              dir="ltr"
              value={btn.customUrl || ""}
              onChange={(e) => {
                const next = [...buttons];
                next[i] = { ...btn, customUrl: e.target.value };
                onChange(next);
              }}
              placeholder="https://..."
            />
          ) : btn.action !== "target_default" && btn.action !== "login" ? (
            <input
              className={fieldClass()}
              dir="ltr"
              value={btn.targetId || ""}
              onChange={(e) => {
                const next = [...buttons];
                next[i] = { ...btn, targetId: e.target.value };
                onChange(next);
              }}
              placeholder={t("landingPages.targetId", "Target ID")}
            />
          ) : null}
          <button
            type="button"
            className="text-xs text-red-600 underline md:col-span-2"
            onClick={() => onChange(buttons.filter((b) => b.id !== btn.id))}
          >
            {t("common.delete", "Delete")}
          </button>
        </div>
      ))}
    </div>
  );
}

function SectionEditor({
  section,
  onChange,
  onRemove,
  onMove,
  canUp,
  canDown,
}: {
  section: LandingSection;
  onChange: (s: LandingSection) => void;
  onRemove: () => void;
  onMove: (dir: "up" | "down") => void;
  canUp: boolean;
  canDown: boolean;
}) {
  const t = useT();
  const typeLabel =
    SECTION_TYPES.find((s) => s.type === section.type)?.labelAr ?? section.type;

  return (
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{typeLabel}</span>
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={section.visible}
              onChange={(e) => onChange({ ...section, visible: e.target.checked })}
            />
            {t("landingPages.visible", "Visible")}
          </label>
        </div>
        <div className="flex gap-2 text-sm">
          <button type="button" disabled={!canUp} className="rounded border px-2 disabled:opacity-40" onClick={() => onMove("up")}>
            ↑
          </button>
          <button type="button" disabled={!canDown} className="rounded border px-2 disabled:opacity-40" onClick={() => onMove("down")}>
            ↓
          </button>
          <button type="button" className="text-red-600 underline" onClick={onRemove}>
            {t("common.delete", "Delete")}
          </button>
        </div>
      </div>

      {"title" in section ? (
        <div className="mb-2 grid gap-2 md:grid-cols-2">
          <input
            className={fieldClass()}
            value={section.title}
            onChange={(e) => onChange({ ...section, title: e.target.value } as LandingSection)}
            placeholder={t("landingPages.sectionTitle", "Section title")}
          />
          <input
            className={fieldClass()}
            value={"titleEn" in section ? section.titleEn || "" : ""}
            onChange={(e) => onChange({ ...section, titleEn: e.target.value } as LandingSection)}
            placeholder="Title (EN)"
          />
        </div>
      ) : null}

      {section.type === "hero" ? (
        <div className="space-y-2">
          <textarea
            className={fieldClass()}
            rows={2}
            value={section.subtitle}
            onChange={(e) => onChange({ ...section, subtitle: e.target.value })}
            placeholder={t("landingPages.subtitleField", "Subtitle")}
          />
          <div className="grid gap-2 md:grid-cols-2">
            <select
              className={fieldClass()}
              value={section.mediaType}
              onChange={(e) =>
                onChange({
                  ...section,
                  mediaType: e.target.value as "image" | "video" | "none",
                })
              }
            >
              <option value="none">{t("landingPages.mediaNone", "No media")}</option>
              <option value="image">{t("landingPages.mediaImage", "Image")}</option>
              <option value="video">{t("landingPages.mediaVideo", "Video")}</option>
            </select>
            <input
              className={fieldClass()}
              dir="ltr"
              value={section.mediaUrl || ""}
              onChange={(e) => onChange({ ...section, mediaUrl: e.target.value })}
              placeholder="Media URL"
            />
          </div>
          <CtaButtonsEditor
            buttons={section.buttons}
            onChange={(buttons) => onChange({ ...section, buttons })}
          />
        </div>
      ) : null}

      {section.type === "features" ? (
        <div className="space-y-2">
          {section.items.map((item, i) => (
            <div key={item.id} className="grid gap-2 rounded border p-2 md:grid-cols-2">
              <input
                className={fieldClass()}
                value={item.title}
                onChange={(e) => {
                  const items = [...section.items];
                  items[i] = { ...item, title: e.target.value };
                  onChange({ ...section, items });
                }}
                placeholder="Title"
              />
              <input
                className={fieldClass()}
                value={item.text}
                onChange={(e) => {
                  const items = [...section.items];
                  items[i] = { ...item, text: e.target.value };
                  onChange({ ...section, items });
                }}
                placeholder="Text"
              />
              <button
                type="button"
                className="text-xs text-red-600 underline md:col-span-2"
                onClick={() =>
                  onChange({ ...section, items: section.items.filter((x) => x.id !== item.id) })
                }
              >
                {t("common.delete", "Delete")}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-xs underline"
            onClick={() =>
              onChange({
                ...section,
                items: [
                  ...section.items,
                  {
                    id: newSectionId(),
                    title: "ميزة",
                    titleEn: "Feature",
                    text: "",
                    textEn: "",
                  },
                ],
              })
            }
          >
            {t("landingPages.addFeature", "Add feature")}
          </button>
        </div>
      ) : null}

      {section.type === "details" ? (
        <div className="space-y-2">
          <textarea
            className={fieldClass()}
            rows={5}
            value={section.body}
            onChange={(e) => onChange({ ...section, body: e.target.value })}
          />
          <input
            className={fieldClass()}
            dir="ltr"
            value={section.imageUrl || ""}
            onChange={(e) => onChange({ ...section, imageUrl: e.target.value })}
            placeholder="Image URL"
          />
        </div>
      ) : null}

      {section.type === "instructor" ? (
        <div className="space-y-2">
          <input
            className={fieldClass()}
            value={section.name}
            onChange={(e) => onChange({ ...section, name: e.target.value })}
            placeholder={t("landingPages.instructorName", "Name")}
          />
          <textarea
            className={fieldClass()}
            rows={3}
            value={section.bio}
            onChange={(e) => onChange({ ...section, bio: e.target.value })}
          />
          <input
            className={fieldClass()}
            dir="ltr"
            value={section.imageUrl || ""}
            onChange={(e) => onChange({ ...section, imageUrl: e.target.value })}
            placeholder="Image URL"
          />
        </div>
      ) : null}

      {section.type === "testimonials" ? (
        <div className="space-y-2">
          {section.items.map((item, i) => (
            <div key={item.id} className="grid gap-2 rounded border p-2">
              <input
                className={fieldClass()}
                value={item.name}
                onChange={(e) => {
                  const items = [...section.items];
                  items[i] = { ...item, name: e.target.value };
                  onChange({ ...section, items });
                }}
                placeholder="Name"
              />
              <textarea
                className={fieldClass()}
                rows={2}
                value={item.text}
                onChange={(e) => {
                  const items = [...section.items];
                  items[i] = { ...item, text: e.target.value };
                  onChange({ ...section, items });
                }}
              />
              <button
                type="button"
                className="text-xs text-red-600 underline"
                onClick={() =>
                  onChange({ ...section, items: section.items.filter((x) => x.id !== item.id) })
                }
              >
                {t("common.delete", "Delete")}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-xs underline"
            onClick={() =>
              onChange({
                ...section,
                items: [
                  ...section.items,
                  { id: newSectionId(), name: "عميل", text: "", textEn: "", rating: 5 },
                ],
              })
            }
          >
            {t("landingPages.addTestimonial", "Add testimonial")}
          </button>
        </div>
      ) : null}

      {section.type === "faq" ? (
        <div className="space-y-2">
          {section.items.map((item, i) => (
            <div key={item.id} className="grid gap-2 rounded border p-2">
              <input
                className={fieldClass()}
                value={item.question}
                onChange={(e) => {
                  const items = [...section.items];
                  items[i] = { ...item, question: e.target.value };
                  onChange({ ...section, items });
                }}
                placeholder="Question"
              />
              <textarea
                className={fieldClass()}
                rows={2}
                value={item.answer}
                onChange={(e) => {
                  const items = [...section.items];
                  items[i] = { ...item, answer: e.target.value };
                  onChange({ ...section, items });
                }}
              />
              <button
                type="button"
                className="text-xs text-red-600 underline"
                onClick={() =>
                  onChange({ ...section, items: section.items.filter((x) => x.id !== item.id) })
                }
              >
                {t("common.delete", "Delete")}
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-xs underline"
            onClick={() =>
              onChange({
                ...section,
                items: [
                  ...section.items,
                  {
                    id: newSectionId(),
                    question: "سؤال؟",
                    questionEn: "Question?",
                    answer: "",
                    answerEn: "",
                  },
                ],
              })
            }
          >
            {t("landingPages.addFaq", "Add FAQ")}
          </button>
        </div>
      ) : null}

      {section.type === "pricing" ? (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={section.useTargetPrice}
              onChange={(e) => onChange({ ...section, useTargetPrice: e.target.checked })}
            />
            {t("landingPages.useTargetPrice", "Use linked target price")}
          </label>
          {!section.useTargetPrice ? (
            <div className="grid gap-2 md:grid-cols-2">
              <input
                className={fieldClass()}
                type="number"
                value={section.priceAmount ?? ""}
                onChange={(e) =>
                  onChange({
                    ...section,
                    priceAmount: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="Price"
              />
              <input
                className={fieldClass()}
                type="number"
                value={section.originalPriceAmount ?? ""}
                onChange={(e) =>
                  onChange({
                    ...section,
                    originalPriceAmount: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="Original price"
              />
            </div>
          ) : null}
          <textarea
            className={fieldClass()}
            rows={2}
            value={section.description}
            onChange={(e) => onChange({ ...section, description: e.target.value })}
          />
          <CtaButtonsEditor
            buttons={section.buttons}
            onChange={(buttons) => onChange({ ...section, buttons })}
          />
        </div>
      ) : null}

      {section.type === "signup" ? (
        <div className="space-y-2">
          <textarea
            className={fieldClass()}
            rows={2}
            value={section.subtitle}
            onChange={(e) => onChange({ ...section, subtitle: e.target.value })}
          />
          <CtaButtonsEditor
            buttons={section.buttons}
            onChange={(buttons) => onChange({ ...section, buttons })}
          />
        </div>
      ) : null}
    </div>
  );
}

export function LandingPageEditorClient({
  initialPage,
  initialStats,
}: {
  initialPage: LandingPageRow;
  initialStats: LandingPageStats;
}) {
  const t = useT();
  const [tab, setTab] = useState<Tab>("content");
  const [page, setPage] = useState(initialPage);
  const [stats] = useState(initialStats);
  const [targets, setTargets] = useState<TargetsPayload | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [addType, setAddType] = useState<LandingSectionType>("hero");

  useEffect(() => {
    void fetch("/api/dashboard/landing-pages/targets", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.courses) setTargets(d as TargetsPayload);
      })
      .catch(() => undefined);
  }, []);

  const save = useCallback(
    async (patch: Partial<LandingPageRow>) => {
      setSaving(true);
      setError("");
      setMessage("");
      const body: Record<string, unknown> = {};
      if (patch.internalName !== undefined) body.internalName = patch.internalName;
      if (patch.slug !== undefined) body.slug = patch.slug;
      if (patch.isPublished !== undefined) body.isPublished = patch.isPublished;
      if (patch.isVisible !== undefined) body.isVisible = patch.isVisible;
      if (patch.sections !== undefined) body.sections = patch.sections;
      if (patch.theme !== undefined) body.theme = patch.theme;
      if (patch.ctaTargetType !== undefined) body.ctaTargetType = patch.ctaTargetType;
      if (patch.ctaTargetId !== undefined) body.ctaTargetId = patch.ctaTargetId;
      if (patch.metaTitle !== undefined) body.metaTitle = patch.metaTitle;
      if (patch.metaDescription !== undefined) body.metaDescription = patch.metaDescription;
      if (patch.metaKeywords !== undefined) body.metaKeywords = patch.metaKeywords;
      if (patch.ogImageUrl !== undefined) body.ogImageUrl = patch.ogImageUrl;

      const r = await fetch(`/api/dashboard/landing-pages/${page.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      setSaving(false);
      if (!r.ok) {
        setError(d.error ?? t("landingPages.saveFailed", "Save failed"));
        return;
      }
      setPage(d.page);
      setMessage(t("landingPages.saved", "Saved"));
    },
    [page.id, t],
  );

  function updateTheme(partial: Partial<LandingTheme>) {
    setPage((p) => ({ ...p, theme: { ...p.theme, ...partial } }));
  }

  function updateSection(index: number, next: LandingSection) {
    setPage((p) => {
      const sections = [...p.sections];
      sections[index] = next;
      return { ...p, sections };
    });
  }

  function moveSection(index: number, dir: "up" | "down") {
    setPage((p) => {
      const sections = [...p.sections];
      const swap = dir === "up" ? index - 1 : index + 1;
      if (swap < 0 || swap >= sections.length) return p;
      [sections[index], sections[swap]] = [sections[swap], sections[index]];
      return { ...p, sections };
    });
  }

  const conversion =
    stats.visits > 0 ? Math.round((stats.purchases / stats.visits) * 1000) / 10 : 0;

  const targetOptions = (() => {
    if (!targets) return [] as TargetOption[];
    if (page.ctaTargetType === "course") return targets.courses;
    if (page.ctaTargetType === "subscription") return targets.plans;
    if (page.ctaTargetType === "library_plan") return targets.libraryPlans;
    if (page.ctaTargetType === "consultation") return targets.consultations;
    if (page.ctaTargetType === "store_product") return targets.products;
    return [];
  })();

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/landing-pages" className="text-sm underline">
            ← {t("landingPages.back", "Back to list")}
          </Link>
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {t("landingPages.visits", "Visits")}: {stats.visits} ·{" "}
            {t("landingPages.ctaClicks", "CTA clicks")}: {stats.ctaClicks} ·{" "}
            {t("landingPages.purchases", "Purchases")}: {stats.purchases} ·{" "}
            {t("landingPages.conversion", "Conversion")}: {conversion}%
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/l/${page.slug}?preview=1`}
            target="_blank"
            className="rounded border px-3 py-2 text-sm"
          >
            {t("landingPages.preview", "Preview")}
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save({ isPublished: !page.isPublished })}
            className="rounded border px-3 py-2 text-sm"
          >
            {page.isPublished
              ? t("landingPages.unpublish", "Unpublish")
              : t("landingPages.publish", "Publish")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void save({
                internalName: page.internalName,
                slug: page.slug,
                sections: page.sections,
                theme: page.theme,
                ctaTargetType: page.ctaTargetType,
                ctaTargetId: page.ctaTargetId,
                metaTitle: page.metaTitle,
                metaDescription: page.metaDescription,
                metaKeywords: page.metaKeywords,
                ogImageUrl: page.ogImageUrl,
                isVisible: page.isVisible,
              })
            }
            className="rounded bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? t("common.saving", "Saving…") : t("common.save", "Save")}
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <div className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-2">
        {(
          [
            ["content", t("landingPages.tabContent", "Content")],
            ["design", t("landingPages.tabDesign", "Design")],
            ["link", t("landingPages.tabLink", "Linking")],
            ["seo", t("landingPages.tabSeo", "SEO")],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded px-3 py-1.5 text-sm ${
              tab === id
                ? "bg-[var(--color-primary)] text-white"
                : "border border-[var(--color-border)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "content" ? (
        <div className="space-y-4">
          <input
            className={fieldClass()}
            value={page.internalName}
            onChange={(e) => setPage((p) => ({ ...p, internalName: e.target.value }))}
            placeholder={t("landingPages.internalName", "Internal name")}
          />
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs text-[var(--color-muted)]">
                {t("landingPages.addSection", "Add section")}
              </label>
              <select
                className={fieldClass()}
                value={addType}
                onChange={(e) => setAddType(e.target.value as LandingSectionType)}
              >
                {SECTION_TYPES.map((s) => (
                  <option key={s.type} value={s.type}>
                    {s.labelAr} / {s.labelEn}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="rounded border px-3 py-2 text-sm"
              onClick={() =>
                setPage((p) => ({ ...p, sections: [...p.sections, emptySection(addType)] }))
              }
            >
              {t("landingPages.add", "Add")}
            </button>
          </div>
          {page.sections.map((section, index) => (
            <SectionEditor
              key={section.id}
              section={section}
              onChange={(s) => updateSection(index, s)}
              onRemove={() =>
                setPage((p) => ({
                  ...p,
                  sections: p.sections.filter((x) => x.id !== section.id),
                }))
              }
              onMove={(dir) => moveSection(index, dir)}
              canUp={index > 0}
              canDown={index < page.sections.length - 1}
            />
          ))}
        </div>
      ) : null}

      {tab === "design" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {(
            [
              ["primaryColor", t("landingPages.primaryColor", "Primary")],
              ["backgroundColor", t("landingPages.backgroundColor", "Background")],
              ["textColor", t("landingPages.textColor", "Text")],
              ["buttonColor", t("landingPages.buttonColorTheme", "Button")],
              ["buttonTextColor", t("landingPages.buttonTextColor", "Button text")],
            ] as [keyof LandingTheme, string][]
          ).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block text-[var(--color-muted)]">{label}</span>
              <input
                type="color"
                className="h-10 w-full cursor-pointer rounded border"
                value={(page.theme[key] as string) || "#000000"}
                onChange={(e) => updateTheme({ [key]: e.target.value })}
              />
            </label>
          ))}
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block text-[var(--color-muted)]">
              {t("landingPages.bgImage", "Background image URL")}
            </span>
            <input
              className={fieldClass()}
              dir="ltr"
              value={page.theme.backgroundImageUrl || ""}
              onChange={(e) => updateTheme({ backgroundImageUrl: e.target.value })}
            />
          </label>
          <label className="block text-sm md:col-span-2">
            <span className="mb-1 block text-[var(--color-muted)]">
              {t("landingPages.bgVideo", "Background video URL")}
            </span>
            <input
              className={fieldClass()}
              dir="ltr"
              value={page.theme.backgroundVideoUrl || ""}
              onChange={(e) => updateTheme({ backgroundVideoUrl: e.target.value })}
            />
          </label>
        </div>
      ) : null}

      {tab === "link" ? (
        <div className="space-y-3 max-w-xl">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">
              {t("landingPages.targetType", "Default target type")}
            </span>
            <select
              className={fieldClass()}
              value={page.ctaTargetType}
              onChange={(e) =>
                setPage((p) => ({
                  ...p,
                  ctaTargetType: e.target.value as LandingCtaTargetType,
                  ctaTargetId: null,
                }))
              }
            >
              <option value="none">{t("landingPages.targetNone", "None")}</option>
              <option value="course">{t("landingPages.actionCourse", "Course")}</option>
              <option value="subscription">{t("landingPages.actionSubscription", "Subscription")}</option>
              <option value="library_plan">{t("landingPages.actionLibrary", "Library plan")}</option>
              <option value="consultation">{t("landingPages.actionConsultation", "Consultation")}</option>
              <option value="store_product">{t("landingPages.actionProduct", "Store product")}</option>
            </select>
          </label>
          {page.ctaTargetType !== "none" ? (
            <label className="block text-sm">
              <span className="mb-1 block text-[var(--color-muted)]">
                {t("landingPages.targetEntity", "Linked entity")}
              </span>
              <select
                className={fieldClass()}
                value={page.ctaTargetId || ""}
                onChange={(e) =>
                  setPage((p) => ({ ...p, ctaTargetId: e.target.value || null }))
                }
              >
                <option value="">{t("landingPages.selectTarget", "Select…")}</option>
                {targetOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.title || opt.name || opt.id}
                    {opt.price != null ? ` — ${opt.price}` : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      ) : null}

      {tab === "seo" ? (
        <div className="grid max-w-2xl gap-3">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">
              {t("landingPages.slug", "URL slug")}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--color-muted)]" dir="ltr">
                /l/
              </span>
              <input
                className={fieldClass()}
                dir="ltr"
                value={page.slug}
                onChange={(e) => setPage((p) => ({ ...p, slug: e.target.value }))}
              />
            </div>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">Meta title</span>
            <input
              className={fieldClass()}
              value={page.metaTitle || ""}
              onChange={(e) => setPage((p) => ({ ...p, metaTitle: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">Meta description</span>
            <textarea
              className={fieldClass()}
              rows={3}
              value={page.metaDescription || ""}
              onChange={(e) => setPage((p) => ({ ...p, metaDescription: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">Keywords</span>
            <input
              className={fieldClass()}
              value={page.metaKeywords || ""}
              onChange={(e) => setPage((p) => ({ ...p, metaKeywords: e.target.value }))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-muted)]">OG image URL</span>
            <input
              className={fieldClass()}
              dir="ltr"
              value={page.ogImageUrl || ""}
              onChange={(e) => setPage((p) => ({ ...p, ogImageUrl: e.target.value }))}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={page.isVisible}
              onChange={(e) => setPage((p) => ({ ...p, isVisible: e.target.checked }))}
            />
            {t("landingPages.visibleOnSite", "Visible when published")}
          </label>
        </div>
      ) : null}
    </div>
  );
}
