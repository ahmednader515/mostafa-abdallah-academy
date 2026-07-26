export type PolicyCard = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  icon?: string | null;
  link?: string | null;
  isVisible: boolean;
  order: number;
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
    link: "/policies/privacy",
    isVisible: true,
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
    link: "/policies/terms",
    isVisible: true,
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
    link: "/policies/usage",
    isVisible: true,
    order: 2,
  },
];

export function parsePolicyCards(raw: string | null | undefined): PolicyCard[] {
  if (!raw?.trim()) return DEFAULT_POLICY_CARDS;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_POLICY_CARDS;
    return parsed
      .map((item, index) => {
        const o = item as Record<string, unknown>;
        return {
          id: String(o.id ?? `policy-${index}`),
          slug: String(o.slug ?? `policy-${index}`),
          titleAr: String(o.titleAr ?? ""),
          titleEn: String(o.titleEn ?? ""),
          bodyAr: String(o.bodyAr ?? ""),
          bodyEn: String(o.bodyEn ?? ""),
          icon: o.icon != null ? String(o.icon) : null,
          link: o.link != null ? String(o.link) : `/policies/${String(o.slug ?? `policy-${index}`)}`,
          isVisible: o.isVisible !== false,
          order: typeof o.order === "number" ? o.order : index,
        } satisfies PolicyCard;
      })
      .sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_POLICY_CARDS;
  }
}
