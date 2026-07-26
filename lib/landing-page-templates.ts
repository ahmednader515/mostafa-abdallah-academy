import {
  DEFAULT_LANDING_THEME,
  emptySection,
  newButtonId,
  newSectionId,
  type LandingSection,
  type LandingTemplateId,
  type LandingTheme,
} from "@/lib/landing-page-types";

export type LandingTemplateMeta = {
  id: LandingTemplateId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
};

export const LANDING_TEMPLATES: LandingTemplateMeta[] = [
  {
    id: "course",
    nameAr: "ترويج كورس",
    nameEn: "Course promo",
    descriptionAr: "بطل + مميزات + تفاصيل + أسعار + تسجيل",
    descriptionEn: "Hero + features + details + pricing + signup",
  },
  {
    id: "subscription",
    nameAr: "اشتراك منصة / مكتبة",
    nameEn: "Platform / library subscription",
    descriptionAr: "بطل + مميزات + أسعار + أسئلة شائعة + تسجيل",
    descriptionEn: "Hero + features + pricing + FAQ + signup",
  },
  {
    id: "consultation",
    nameAr: "حجز استشارة",
    nameEn: "Consultation booking",
    descriptionAr: "بطل + مقدم الخدمة + تفاصيل + آراء + تسجيل",
    descriptionEn: "Hero + instructor + details + testimonials + signup",
  },
  {
    id: "product",
    nameAr: "منتج / خدمة متجر",
    nameEn: "Store product / service",
    descriptionAr: "بطل + تفاصيل + مميزات + أسعار + تسجيل",
    descriptionEn: "Hero + details + features + pricing + signup",
  },
];

function defaultCta(labelAr: string, labelEn: string) {
  return {
    id: newButtonId(),
    label: labelAr,
    labelEn,
    action: "target_default" as const,
  };
}

export function buildTemplateContent(templateId: LandingTemplateId): {
  sections: LandingSection[];
  theme: LandingTheme;
} {
  const theme: LandingTheme = { ...DEFAULT_LANDING_THEME };

  if (templateId === "course") {
    const hero = emptySection("hero");
    if (hero.type === "hero") {
      hero.title = "ابدأ رحلتك التعليمية اليوم";
      hero.titleEn = "Start your learning journey today";
      hero.subtitle = "كورس عملي يوصلك للنتيجة بسرعة.";
      hero.subtitleEn = "A practical course that gets you results fast.";
      hero.buttons = [defaultCta("اشترِ الكورس", "Buy the course")];
    }
    const features = emptySection("features");
    if (features.type === "features") {
      features.items = [
        {
          id: newSectionId(),
          title: "محتوى عملي",
          titleEn: "Practical content",
          text: "تطبيقات حقيقية خطوة بخطوة.",
          textEn: "Real applications, step by step.",
        },
        {
          id: newSectionId(),
          title: "متابعة مستمرة",
          titleEn: "Ongoing support",
          text: "تواصل ودعم أثناء التعلم.",
          textEn: "Support while you learn.",
        },
        {
          id: newSectionId(),
          title: "شهادة",
          titleEn: "Certificate",
          text: "احصل على شهادة عند الإتمام.",
          textEn: "Earn a certificate on completion.",
        },
      ];
    }
    const details = emptySection("details");
    const pricing = emptySection("pricing");
    if (pricing.type === "pricing") {
      pricing.buttons = [defaultCta("اشترِ الآن", "Buy now")];
    }
    const signup = emptySection("signup");
    if (signup.type === "signup") {
      signup.buttons = [defaultCta("اشترِ الكورس", "Buy the course")];
    }
    return { sections: [hero, features, details, pricing, signup], theme };
  }

  if (templateId === "subscription") {
    const hero = emptySection("hero");
    if (hero.type === "hero") {
      hero.title = "اشترك في المنصة";
      hero.titleEn = "Subscribe to the platform";
      hero.subtitle = "وصول كامل للكورسات والمكتبة.";
      hero.subtitleEn = "Full access to courses and the library.";
      hero.buttons = [defaultCta("اشترك الآن", "Subscribe now")];
    }
    const features = emptySection("features");
    const pricing = emptySection("pricing");
    if (pricing.type === "pricing") {
      pricing.buttons = [defaultCta("اشترك الآن", "Subscribe now")];
    }
    const faq = emptySection("faq");
    const signup = emptySection("signup");
    if (signup.type === "signup") {
      signup.buttons = [defaultCta("اشترك الآن", "Subscribe now")];
    }
    return { sections: [hero, features, pricing, faq, signup], theme };
  }

  if (templateId === "consultation") {
    const hero = emptySection("hero");
    if (hero.type === "hero") {
      hero.title = "احجز استشارتك";
      hero.titleEn = "Book your consultation";
      hero.subtitle = "جلسة مخصصة تساعدك على اتخاذ القرار الصحيح.";
      hero.subtitleEn = "A tailored session to help you decide.";
      hero.buttons = [defaultCta("احجز استشارة", "Book consultation")];
    }
    const instructor = emptySection("instructor");
    const details = emptySection("details");
    const testimonials = emptySection("testimonials");
    const signup = emptySection("signup");
    if (signup.type === "signup") {
      signup.title = "احجز الآن";
      signup.titleEn = "Book now";
      signup.buttons = [defaultCta("احجز استشارة", "Book consultation")];
    }
    return { sections: [hero, instructor, details, testimonials, signup], theme };
  }

  // product
  const hero = emptySection("hero");
  if (hero.type === "hero") {
    hero.title = "منتجك جاهز";
    hero.titleEn = "Your product is ready";
    hero.subtitle = "احصل عليه فوراً بعد الشراء.";
    hero.subtitleEn = "Get it instantly after purchase.";
    hero.buttons = [defaultCta("شراء الآن", "Buy now")];
  }
  const details = emptySection("details");
  const features = emptySection("features");
  const pricing = emptySection("pricing");
  if (pricing.type === "pricing") {
    pricing.buttons = [defaultCta("شراء الآن", "Buy now")];
  }
  const signup = emptySection("signup");
  if (signup.type === "signup") {
    signup.buttons = [defaultCta("شراء الآن", "Buy now")];
  }
  return { sections: [hero, details, features, pricing, signup], theme };
}
