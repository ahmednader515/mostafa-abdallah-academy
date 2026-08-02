export type PolicyPlacement = "header" | "footer" | "both" | "none";
export type PolicyStatus = "draft" | "published";

export type PolicyCard = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  icon?: string | null;
  link?: string | null;
  /** توافق قديم — يُشتق من status عند القراءة */
  isVisible: boolean;
  /** draft = مخفي عن الزوار | published = ظاهر حسب placement */
  status: PolicyStatus;
  /** أين تظهر روابط الصفحة في الواجهة */
  placement: PolicyPlacement;
  order: number;
};

export type PolicyNavLink = {
  id: string;
  slug: string;
  href: string;
  titleAr: string;
  titleEn: string;
};

export const DEFAULT_POLICY_CARDS: PolicyCard[] = [
  {
    id: "privacy",
    slug: "privacy",
    titleAr: "سياسة الخصوصية",
    titleEn: "Privacy Policy",
    bodyAr:
      "نحترم خصوصيتك. نجمع البيانات اللازمة لتشغيل الحساب والتعلم فقط، ولا نبيع بياناتك لأطراف ثالثة.",
    bodyEn:
      "We respect your privacy. We collect only data needed to run your account and learning experience, and we do not sell your data.",
    icon: "shield",
    link: "/privacy",
    isVisible: true,
    status: "published",
    placement: "both",
    order: 0,
  },
  {
    id: "terms",
    slug: "terms",
    titleAr: "الشروط والأحكام",
    titleEn: "Terms of Service",
    bodyAr:
      "باستخدامك للمنصة فإنك توافق على قواعد الاستخدام، وحقوق المحتوى، وسياسات الاشتراك والاسترجاع المعمول بها.",
    bodyEn:
      "By using the platform you agree to our usage rules, content rights, and applicable subscription and refund policies.",
    icon: "doc",
    link: "/terms",
    isVisible: true,
    status: "published",
    placement: "both",
    order: 1,
  },
  {
    id: "usage",
    slug: "usage",
    titleAr: "سياسة الاستخدام",
    titleEn: "Acceptable Use",
    bodyAr:
      "يُمنع مشاركة الحساب، إعادة بيع المحتوى، أو إساءة استخدام المجتمع. المخالفة قد تؤدي لإيقاف الوصول.",
    bodyEn:
      "Account sharing, reselling content, or abusing the community is prohibited. Violations may result in access suspension.",
    icon: "rules",
    link: "/usage",
    isVisible: true,
    status: "published",
    placement: "footer",
    order: 2,
  },
];

const PLACEMENTS: PolicyPlacement[] = ["header", "footer", "both", "none"];

export function sanitizePolicySlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06ff-_]/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function policyPublicHref(card: Pick<PolicyCard, "slug" | "link">): string {
  const custom = card.link?.trim();
  if (custom && custom.startsWith("/") && !custom.startsWith("//")) return custom;
  const slug = sanitizePolicySlug(card.slug) || "page";
  return `/${slug}`;
}

export function isPolicyPublished(card: PolicyCard): boolean {
  return card.status === "published" && card.isVisible !== false;
}

function normalizePlacement(raw: unknown): PolicyPlacement {
  const v = String(raw ?? "footer");
  return (PLACEMENTS as string[]).includes(v) ? (v as PolicyPlacement) : "footer";
}

function normalizeStatus(raw: unknown, isVisible: boolean): PolicyStatus {
  if (raw === "draft" || raw === "published") return raw;
  return isVisible ? "published" : "draft";
}

export function parsePolicyCards(raw: string | null | undefined): PolicyCard[] {
  if (!raw?.trim()) return DEFAULT_POLICY_CARDS.map((c) => ({ ...c }));
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEFAULT_POLICY_CARDS.map((c) => ({ ...c }));
    }
    return parsed
      .map((item, index) => {
        const o = item as Record<string, unknown>;
        const slug = sanitizePolicySlug(String(o.slug ?? `page-${index}`)) || `page-${index}`;
        const isVisible = o.isVisible !== false;
        const status = normalizeStatus(o.status, isVisible);
        return {
          id: String(o.id ?? `policy-${index}`),
          slug,
          titleAr: String(o.titleAr ?? ""),
          titleEn: String(o.titleEn ?? ""),
          bodyAr: String(o.bodyAr ?? ""),
          bodyEn: String(o.bodyEn ?? ""),
          icon: o.icon != null ? String(o.icon) : null,
          link: o.link != null ? String(o.link) : `/${slug}`,
          isVisible: status === "published",
          status,
          placement: normalizePlacement(o.placement),
          order: typeof o.order === "number" ? o.order : index,
        } satisfies PolicyCard;
      })
      .sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_POLICY_CARDS.map((c) => ({ ...c }));
  }
}

export function serializePolicyCards(cards: PolicyCard[]): string {
  const normalized = cards.map((c, index) => {
    const slug = sanitizePolicySlug(c.slug) || `page-${index + 1}`;
    const status: PolicyStatus = c.status === "draft" ? "draft" : "published";
    return {
      ...c,
      slug,
      status,
      isVisible: status === "published",
      placement: normalizePlacement(c.placement),
      link: policyPublicHref({ slug, link: c.link || `/${slug}` }),
      order: typeof c.order === "number" ? c.order : index,
    };
  });
  return JSON.stringify(normalized);
}

export function listPublishedPolicyCards(cards: PolicyCard[]): PolicyCard[] {
  return cards.filter(isPolicyPublished).sort((a, b) => a.order - b.order);
}

function toNavLink(card: PolicyCard): PolicyNavLink {
  return {
    id: card.id,
    slug: card.slug,
    href: policyPublicHref(card),
    titleAr: card.titleAr,
    titleEn: card.titleEn,
  };
}

export function listPolicyNavLinksForHeader(cards: PolicyCard[]): PolicyNavLink[] {
  return listPublishedPolicyCards(cards)
    .filter((c) => c.placement === "header" || c.placement === "both")
    .map(toNavLink);
}

export function listPolicyNavLinksForFooter(cards: PolicyCard[]): PolicyNavLink[] {
  return listPublishedPolicyCards(cards)
    .filter((c) => c.placement === "footer" || c.placement === "both")
    .map(toNavLink);
}

export function findPublishedPolicyBySlug(
  cards: PolicyCard[],
  slug: string,
): PolicyCard | undefined {
  const s = sanitizePolicySlug(slug);
  if (!s) return undefined;
  return listPublishedPolicyCards(cards).find((c) => c.slug === s);
}

/** مسارات محجوزة لا تُستخدم كـ slug لصفحات السياسات على الجذر */
export const RESERVED_POLICY_SLUGS = new Set([
  "api",
  "login",
  "register",
  "dashboard",
  "courses",
  "library",
  "teachers",
  "forum",
  "jobs",
  "live",
  "consultations",
  "certificates",
  "exams",
  "external-training",
  "subscriptions",
  "store",
  "search",
  "policies",
  "l",
  "sitemap.xml",
  "robots.txt",
  "favicon.ico",
  "_next",
]);
